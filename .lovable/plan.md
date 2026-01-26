
# Enhanced Process Monitoring & Debugging

## Goal
Add detailed process visibility to help debug SRT and multicast issues directly from the dashboard.

## Implementation

### 1. Enhanced Logs Panel with Filtering
**File:** `src/components/dashboard/LogsPanel.tsx`

Add filter controls to the logs panel:
- Filter by log level (info, warn, error, debug)
- Filter by channel
- Search text filter
- Auto-refresh toggle

### 2. Process Status Panel (New Component)
**File:** `src/components/dashboard/ProcessPanel.tsx`

Create a new panel showing:
- Running `srt-live-transmit` processes (PID, command line, uptime)
- Process memory/CPU usage per channel
- Last stdout/stderr output snippets

### 3. Channel Diagnostics View
**File:** `src/components/dashboard/ChannelDiagnostics.tsx`

Add a diagnostics modal/drawer for each channel:
- SRT connection status (connected/waiting/error)
- Multicast output status (packets sent, errors)
- Network interface being used
- Quick diagnostic commands (copy-paste for terminal)

### 4. Agent Enhancement - Capture More Details
**File:** `server-agent/agent.py`

Enhance the agent to log more diagnostic information:
- SRT connection events (listener ready, client connected, disconnected)
- Multicast send statistics (packets/sec, bytes/sec)
- Capture srt-live-transmit stderr output and send to logs table
- Add periodic "health check" logs for running channels

```python
# Add to agent.py - capture process output
def _monitor_process(self, channel_id: str):
    """Monitor a channel process and capture output"""
    while self.running:
        # Read stdout line by line
        line = cp.process.stdout.readline()
        if line:
            # Parse SRT stats from verbose output
            self.log("debug", line.strip(), channel_id)
        
        # Check for SRT connection status
        if "SRT connected" in line:
            self.log("info", "SRT client connected", channel_id)
```

### 5. Quick Diagnostic Commands Panel
**File:** `src/components/dashboard/DiagnosticCommands.tsx`

Show copy-paste commands for server-side debugging:
- `journalctl -u lovable-agent -f` - Live agent logs
- `ps aux | grep srt-live-transmit` - Running processes
- `tcpdump -i any host 239.1.x.x` - Multicast traffic
- `ip route show table all | grep multicast` - Routing

### 6. Database Schema Update
Add a new field to channels for storing the last process output:

```sql
ALTER TABLE channels ADD COLUMN IF NOT EXISTS 
  last_output TEXT,
  last_output_at TIMESTAMPTZ;
```

## Technical Details

### Agent Process Output Capture
The agent will:
1. Read stdout/stderr from srt-live-transmit in real-time
2. Parse SRT statistics (bitrate, RTT, packet loss)
3. Send important events to server_logs table
4. Store last 1KB of output in channel.last_output

### Frontend Updates
- Add a "Diagnostics" tab next to Channels and Logs
- Real-time process list via polling (every 5s)
- Copy button for diagnostic commands
- Expandable log entries to show full details

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/dashboard/ProcessPanel.tsx` | Create | Show running processes |
| `src/components/dashboard/DiagnosticCommands.tsx` | Create | Terminal commands helper |
| `src/components/dashboard/LogsPanel.tsx` | Modify | Add filtering |
| `src/pages/Dashboard.tsx` | Modify | Add Diagnostics tab |
| `server-agent/agent.py` | Modify | Capture process output |
| Database migration | Create | Add last_output column |

## Immediate Workaround (No Code Changes)

While I implement this, you can debug on your server:

```bash
# 1. Watch agent logs live
sudo journalctl -u lovable-agent -f

# 2. Check running processes
ps aux | grep srt

# 3. Test multicast routing
ip route | grep 239

# 4. Check if multicast is being sent
sudo tcpdump -i any -c 10 host 239.1.1.1

# 5. Ensure multicast route exists
sudo ip route add 239.0.0.0/8 dev eth0
```
