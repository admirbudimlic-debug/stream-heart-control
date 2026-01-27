#!/usr/bin/env python3
"""
Lovable Streaming Server Agent
Connects to Supabase, reports system stats, and manages SRT→Multicast channels.
"""

import os
import sys
import time
import json
import signal
import subprocess
import threading
import psutil
import shutil
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from collections import deque

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)


# Configuration from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://jlrlhnxqdlkbiszzzcag.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscmxobnhxZGxrYmlzenp6Y2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzUzODIsImV4cCI6MjA4NDk1MTM4Mn0.7s9_RlXpK8Vz83Zd_A5a_Y2HVrjN6oqir_VbHgB53G8")
SERVER_TOKEN = os.environ.get("SERVER_TOKEN", "")

HEARTBEAT_INTERVAL = 5  # seconds
COMMAND_POLL_INTERVAL = 2  # seconds
OUTPUT_BUFFER_SIZE = 50  # lines to keep in memory
OUTPUT_LOG_INTERVAL = 10  # seconds between logging output


@dataclass
class ChannelProcess:
    """Tracks a running srt-live-transmit process"""
    channel_id: str
    process: subprocess.Popen
    srt_input: str
    multicast_output: str
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    output_buffer: deque = field(default_factory=lambda: deque(maxlen=OUTPUT_BUFFER_SIZE))
    last_output_log: float = field(default_factory=time.time)


class StreamingAgent:
    def __init__(self, supabase: Client, server_id: str, base_path: str):
        self.supabase = supabase
        self.server_id = server_id
        self.base_path = base_path
        self.running = True
        self.processes: Dict[str, ChannelProcess] = {}
        self.lock = threading.Lock()
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.log("info", f"Received signal {signum}, shutting down...")
        self.running = False
        self._stop_all_channels()
    
    def log(self, level: str, message: str, channel_id: str = None, details: dict = None):
        """Send log entry to Supabase"""
        try:
            log_entry = {
                "server_id": self.server_id,
                "level": level,
                "message": message,
            }
            if channel_id:
                log_entry["channel_id"] = channel_id
            if details:
                log_entry["details"] = details
            
            self.supabase.table("server_logs").insert(log_entry).execute()
            print(f"[{level.upper()}] {message}")
        except Exception as e:
            print(f"[ERROR] Failed to send log: {e}")
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Collect system resource statistics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = shutil.disk_usage(self.base_path)
        
        return {
            "cpu_usage": round(cpu_percent, 1),
            "memory_usage": round(memory.percent, 1),
            "disk_usage": round((disk.used / disk.total) * 100, 1),
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
        }
    
    def update_server_status(self):
        """Update server status and resource usage in database"""
        try:
            stats = self.get_system_stats()
            stats["status"] = "online"
            stats["last_seen_at"] = datetime.now(timezone.utc).isoformat()
            
            self.supabase.table("servers").update(stats).eq("id", self.server_id).execute()
        except Exception as e:
            print(f"[ERROR] Failed to update server status: {e}")
    
    def _start_channel(self, channel: dict) -> bool:
        """Start srt-live-transmit for a channel"""
        channel_id = channel["id"]
        srt_input = channel["srt_input"]
        multicast_output = channel["multicast_output"]
        folder_name = channel["folder_name"]
        
        # Create channel folder
        channel_path = os.path.join(self.base_path, folder_name)
        os.makedirs(channel_path, exist_ok=True)
        
        # Build srt-live-transmit command
        # Output format: udp://239.1.x.x:5000?pkt_size=1316
        udp_output = f"udp://{multicast_output}?pkt_size=1316&ttl=5"
        
        cmd = [
            "srt-live-transmit",
            srt_input,
            udp_output,
            "-v",  # Verbose for logging
            "-s", "1000"  # Stats interval in ms
        ]
        
        self.log("info", f"Starting channel: {' '.join(cmd)}", channel_id)
        
        try:
            # Start the process
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            cp = ChannelProcess(
                channel_id=channel_id,
                process=process,
                srt_input=srt_input,
                multicast_output=multicast_output
            )
            
            with self.lock:
                self.processes[channel_id] = cp
            
            # Update channel status
            self.supabase.table("channels").update({
                "status": "running",
                "pid": process.pid,
                "error_message": None
            }).eq("id", channel_id).execute()
            
            # Start output monitoring thread
            threading.Thread(
                target=self._monitor_process,
                args=(channel_id,),
                daemon=True
            ).start()
            
            self.log("info", f"Channel started with PID {process.pid}", channel_id)
            return True
            
        except FileNotFoundError:
            error = "srt-live-transmit not found. Please install libsrt-tools."
            self.log("error", error, channel_id)
            self.supabase.table("channels").update({
                "status": "error",
                "error_message": error
            }).eq("id", channel_id).execute()
            return False
        except Exception as e:
            error = str(e)
            self.log("error", f"Failed to start channel: {error}", channel_id)
            self.supabase.table("channels").update({
                "status": "error",
                "error_message": error
            }).eq("id", channel_id).execute()
            return False
    
    def _monitor_process(self, channel_id: str):
        """Monitor a channel process, capture output, and update stats"""
        while self.running:
            with self.lock:
                if channel_id not in self.processes:
                    break
                cp = self.processes[channel_id]
            
            # Check if process is still running
            if cp.process.poll() is not None:
                # Process has exited
                exit_code = cp.process.returncode
                with self.lock:
                    if channel_id in self.processes:
                        del self.processes[channel_id]
                
                if exit_code != 0:
                    # Read any remaining output
                    output = cp.process.stdout.read() if cp.process.stdout else ""
                    error_msg = f"Process exited with code {exit_code}"
                    if output:
                        error_msg += f": {output[-500:]}"  # Last 500 chars
                    
                    self.log("error", error_msg, channel_id)
                    self.supabase.table("channels").update({
                        "status": "error",
                        "pid": None,
                        "error_message": error_msg,
                        "last_output": output[-1024:] if output else None,
                        "last_output_at": datetime.now(timezone.utc).isoformat()
                    }).eq("id", channel_id).execute()
                else:
                    self.supabase.table("channels").update({
                        "status": "stopped",
                        "pid": None
                    }).eq("id", channel_id).execute()
                break
            
            # Read stdout line by line (non-blocking would be better but this works)
            try:
                # Use select or non-blocking read for better performance
                import select
                if select.select([cp.process.stdout], [], [], 0.1)[0]:
                    line = cp.process.stdout.readline()
                    if line:
                        line = line.strip()
                        cp.output_buffer.append(line)
                        
                        # Parse and log important events
                        self._parse_srt_output(line, channel_id)
            except:
                pass
            
            # Update uptime and periodically save output
            uptime = int((datetime.now(timezone.utc) - cp.started_at).total_seconds())
            now = time.time()
            
            update_data = {"uptime_seconds": uptime}
            
            # Periodically save output buffer to database
            if now - cp.last_output_log >= OUTPUT_LOG_INTERVAL:
                output_text = "\n".join(cp.output_buffer)
                if output_text:
                    update_data["last_output"] = output_text[-1024:]  # Last 1KB
                    update_data["last_output_at"] = datetime.now(timezone.utc).isoformat()
                cp.last_output_log = now
            
            try:
                self.supabase.table("channels").update(update_data).eq("id", channel_id).execute()
            except:
                pass
            
            time.sleep(1)
    
    def _parse_srt_output(self, line: str, channel_id: str):
        """Parse srt-live-transmit output for important events"""
        line_lower = line.lower()
        
        # Detect connection events
        if "accepted" in line_lower or "connected" in line_lower:
            self.log("info", f"SRT client connected: {line}", channel_id)
        elif "disconnected" in line_lower or "broken" in line_lower:
            self.log("warn", f"SRT connection issue: {line}", channel_id)
        elif "error" in line_lower:
            self.log("error", f"SRT error: {line}", channel_id)
        elif "listening" in line_lower or "ready" in line_lower:
            self.log("info", f"SRT ready: {line}", channel_id)
        
        # Parse statistics if present (srt-live-transmit with -s option)
        if "mbps" in line_lower or "kbps" in line_lower:
            self.log("debug", f"Stats: {line}", channel_id)
    
    def _stop_channel(self, channel_id: str, graceful: bool = True) -> bool:
        """Stop a running channel"""
        with self.lock:
            if channel_id not in self.processes:
                self.log("warn", "Channel not running", channel_id)
                return False
            cp = self.processes[channel_id]
        
        self.log("info", f"Stopping channel (PID: {cp.process.pid})", channel_id)
        
        try:
            if graceful:
                cp.process.terminate()
                try:
                    cp.process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    cp.process.kill()
                    cp.process.wait()
            else:
                cp.process.kill()
                cp.process.wait()
            
            with self.lock:
                if channel_id in self.processes:
                    del self.processes[channel_id]
            
            self.supabase.table("channels").update({
                "status": "stopped",
                "pid": None
            }).eq("id", channel_id).execute()
            
            self.log("info", "Channel stopped", channel_id)
            return True
            
        except Exception as e:
            self.log("error", f"Failed to stop channel: {e}", channel_id)
            return False
    
    def _stop_all_channels(self):
        """Stop all running channels"""
        with self.lock:
            channel_ids = list(self.processes.keys())
        
        for channel_id in channel_ids:
            self._stop_channel(channel_id, graceful=False)
    
    def process_commands(self):
        """Poll for and process pending commands"""
        try:
            result = self.supabase.table("commands")\
                .select("*")\
                .eq("server_id", self.server_id)\
                .eq("status", "pending")\
                .order("created_at")\
                .execute()
            
            for cmd in result.data:
                self._process_command(cmd)
                
        except Exception as e:
            print(f"[ERROR] Failed to poll commands: {e}")
    
    def _process_command(self, cmd: dict):
        """Process a single command"""
        cmd_id = cmd["id"]
        cmd_type = cmd["command_type"]
        channel_id = cmd.get("channel_id")
        payload = cmd.get("payload", {})
        
        # Mark as processing
        self.supabase.table("commands").update({
            "status": "processing"
        }).eq("id", cmd_id).execute()
        
        success = False
        result = {}
        error_msg = None
        
        try:
            if cmd_type == "start_channel":
                # Get channel details
                ch_result = self.supabase.table("channels")\
                    .select("*")\
                    .eq("id", channel_id)\
                    .single()\
                    .execute()
                
                if ch_result.data:
                    # Update status to starting
                    self.supabase.table("channels").update({
                        "status": "starting"
                    }).eq("id", channel_id).execute()
                    
                    success = self._start_channel(ch_result.data)
                else:
                    error_msg = "Channel not found"
                    
            elif cmd_type == "stop_channel":
                # Update status to stopping
                self.supabase.table("channels").update({
                    "status": "stopping"
                }).eq("id", channel_id).execute()
                
                success = self._stop_channel(channel_id)
                
            elif cmd_type == "restart_channel":
                self._stop_channel(channel_id)
                time.sleep(1)
                
                ch_result = self.supabase.table("channels")\
                    .select("*")\
                    .eq("id", channel_id)\
                    .single()\
                    .execute()
                
                if ch_result.data:
                    success = self._start_channel(ch_result.data)
                    
            elif cmd_type == "get_status":
                result = {
                    "running_channels": list(self.processes.keys()),
                    "stats": self.get_system_stats()
                }
                success = True
                
            else:
                error_msg = f"Unknown command type: {cmd_type}"
                
        except Exception as e:
            error_msg = str(e)
            self.log("error", f"Command failed: {error_msg}")
        
        # Update command status
        update_data = {
            "status": "completed" if success else "failed",
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "result": result if result else None,
            "error_message": error_msg
        }
        self.supabase.table("commands").update(update_data).eq("id", cmd_id).execute()
    
    def run(self):
        """Main agent loop"""
        self.log("info", "Agent started")
        self.update_server_status()
        
        last_heartbeat = 0
        last_command_poll = 0
        
        while self.running:
            now = time.time()
            
            # Heartbeat
            if now - last_heartbeat >= HEARTBEAT_INTERVAL:
                self.update_server_status()
                last_heartbeat = now
            
            # Command polling
            if now - last_command_poll >= COMMAND_POLL_INTERVAL:
                self.process_commands()
                last_command_poll = now
            
            time.sleep(0.5)
        
        # Cleanup
        self.log("info", "Agent shutting down")
        self.supabase.table("servers").update({
            "status": "offline"
        }).eq("id", self.server_id).execute()


def authenticate(supabase: Client, token: str) -> Optional[str]:
    """Authenticate with server token and return server ID"""
    try:
        result = supabase.table("servers")\
            .select("id, name, base_path")\
            .eq("token", token)\
            .single()\
            .execute()
        
        if result.data:
            return result.data
        return None
    except Exception as e:
        print(f"Authentication failed: {e}")
        return None


def main():
    if not SERVER_TOKEN:
        print("Error: SERVER_TOKEN environment variable not set")
        print("Usage: SERVER_TOKEN=<your-token> python agent.py")
        sys.exit(1)
    
    print("=" * 60)
    print("Lovable Streaming Server Agent")
    print("=" * 60)
    print(f"Connecting to: {SUPABASE_URL}")
    
    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Authenticate
    print("Authenticating...")
    server = authenticate(supabase, SERVER_TOKEN)
    
    if not server:
        print("Error: Invalid server token")
        sys.exit(1)
    
    server_id = server["id"]
    server_name = server["name"]
    base_path = server.get("base_path") or "/var/streaming"
    
    print(f"Authenticated as: {server_name} ({server_id})")
    print(f"Base path: {base_path}")
    
    # Ensure base path exists
    os.makedirs(base_path, exist_ok=True)
    
    # Create and run agent
    agent = StreamingAgent(supabase, server_id, base_path)
    agent.run()


if __name__ == "__main__":
    main()
