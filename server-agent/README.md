# Lovable Streaming Server Agent

A Python-based agent that runs on Ubuntu servers to manage SRT-to-Multicast streaming channels.

## Features

- **Reverse Connection**: Agent connects outbound to avoid port forwarding
- **System Monitoring**: Reports CPU, memory, and disk usage in real-time
- **Channel Management**: Start/stop SRT→Multicast channels via srt-live-transmit
- **Command Queue**: Receives commands from the dashboard via Supabase
- **Auto-Recovery**: Systemd service with automatic restart on failure

## Requirements

- Ubuntu 20.04+ (tested on 22.04 and 24.04)
- Root access for installation
- Network access to Supabase (outbound HTTPS)

## Quick Install

1. Add a server in the Lovable dashboard and copy the token
2. Clone and run the installer:

```bash
git clone https://github.com/admirbudimlic-debug/stream-heart-control.git
cd stream-heart-control/server-agent
chmod +x install.sh
sudo ./install.sh --token YOUR_SERVER_TOKEN
```

**If you get "command not found"**, fix line endings first:
```bash
sed -i 's/\r$//' install.sh
chmod +x install.sh
sudo /bin/bash ./install.sh --token YOUR_SERVER_TOKEN
```

Alternatively, run from the repository root:
```bash
cd stream-heart-control
chmod +x install.sh
sudo ./install.sh --token YOUR_SERVER_TOKEN
```

## Manual Installation

### 1. Install Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv libsrt-openssl-dev srt-tools ffmpeg
```

### 2. Install TSDuck (for recording)

```bash
curl -sL https://tsduck.io/download/tsduck.gpg | sudo gpg --dearmor -o /usr/share/keyrings/tsduck.gpg
echo "deb [signed-by=/usr/share/keyrings/tsduck.gpg] https://tsduck.io/download/debian/ stable main" | sudo tee /etc/apt/sources.list.d/tsduck.list
sudo apt update
sudo apt install -y tsduck
```

### 3. Set Up Agent

```bash
sudo mkdir -p /opt/lovable-agent /var/streaming
cd /opt/lovable-agent

# Create virtual environment
sudo python3 -m venv venv
source venv/bin/activate
pip install supabase psutil

# Copy agent.py to /opt/lovable-agent/
```

### 4. Configure Environment

Create `/opt/lovable-agent/.env`:

```env
SUPABASE_URL=https://jlrlhnxqdlkbiszzzcag.supabase.co
SUPABASE_KEY=<anon-key>
SERVER_TOKEN=<your-server-token>
```

### 5. Create Systemd Service

Create `/etc/systemd/system/lovable-agent.service`:

```ini
[Unit]
Description=Lovable Streaming Server Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/lovable-agent
EnvironmentFile=/opt/lovable-agent/.env
ExecStart=/opt/lovable-agent/venv/bin/python /opt/lovable-agent/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lovable-agent
sudo systemctl start lovable-agent
```

## Usage

### View Logs

```bash
journalctl -u lovable-agent -f
```

### Restart Agent

```bash
sudo systemctl restart lovable-agent
```

### Stop Agent

```bash
sudo systemctl stop lovable-agent
```

## How It Works

1. **Authentication**: Agent authenticates with its server token
2. **Heartbeat**: Reports system stats every 5 seconds
3. **Command Polling**: Checks for pending commands every 2 seconds
4. **Channel Execution**: Runs srt-live-transmit for each active channel

### Command Types

| Command | Description |
|---------|-------------|
| `start_channel` | Start SRT→Multicast for a channel |
| `stop_channel` | Stop a running channel |
| `restart_channel` | Stop and restart a channel |
| `get_status` | Get current agent status |

### Multicast Address Format

Channels use multicast addresses in the format:
```
239.1.[server_number].[channel_number]:5000
```

Example: Server 2, Channel 3 → `239.1.2.3:5000`

## Troubleshooting

### Agent won't start

Check logs:
```bash
journalctl -u lovable-agent -n 100
```

### srt-live-transmit not found

Verify installation:
```bash
which srt-live-transmit
```

If missing, install srt-tools:
```bash
sudo apt install srt-tools
```

### Channel fails to start

- Verify SRT source is reachable
- Check multicast output address format
- Look for error messages in dashboard logs

## License

MIT
