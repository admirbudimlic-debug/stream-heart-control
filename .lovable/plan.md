
# Fix TSDuck Installation Failure

## Problem
The installer fails at step 4/6 with `gpg: no valid OpenPGP data found` because the TSDuck GPG key URL (`https://tsduck.io/download/tsduck.gpg`) is either:
- Returning an HTML error page instead of the key
- Has been moved or changed
- Is temporarily unavailable

## Solution
Update the install script to use a more robust TSDuck installation method that doesn't rely on the potentially broken GPG key URL.

## Implementation

### 1. Update TSDuck installation logic
**File:** `server-agent/install.sh`

Replace the current TSDuck installation with a priority chain:
1. First try to install from Ubuntu's default apt repos (some Ubuntu versions include TSDuck)
2. If that fails, download the .deb package directly from GitHub releases (skip the broken GPG repo entirely)
3. Make TSDuck optional - the core streaming functionality only requires `srt-live-transmit`

```bash
# Step 4: Install TSDuck (optional - for recording)
echo -e "${BLUE}[4/6] Installing TSDuck (optional, for recording)...${NC}"
if ! command -v tsp &> /dev/null; then
    # Try apt first (some Ubuntu versions have it)
    apt-get install -y -qq tsduck 2>/dev/null || {
        echo -e "${YELLOW}TSDuck not in apt, downloading from GitHub...${NC}"
        TSDUCK_VERSION="3.37-3840"
        
        # Detect architecture
        ARCH=$(dpkg --print-architecture)
        if [ "$ARCH" = "amd64" ]; then
            wget -q "https://github.com/tsduck/tsduck/releases/download/v3.37-3840/tsduck_${TSDUCK_VERSION}.ubuntu24_amd64.deb" -O /tmp/tsduck.deb && \
            dpkg -i /tmp/tsduck.deb && \
            apt-get install -f -y -qq
            rm -f /tmp/tsduck.deb
        else
            echo -e "${YELLOW}TSDuck: unsupported architecture $ARCH, skipping${NC}"
        fi
    }
fi

if command -v tsp &> /dev/null; then
    echo -e "${GREEN}✓ TSDuck installed: $(which tsp)${NC}"
else
    echo -e "${YELLOW}⚠ TSDuck not installed (recording features unavailable)${NC}"
fi
```

### 2. Key changes
- Remove the broken GPG key download attempt entirely
- Try Ubuntu's apt repos first (no external key needed)
- Fall back to direct .deb download from GitHub (reliable)
- Make TSDuck installation non-fatal (streaming works without it)
- Add architecture detection for the .deb download
- Clean up temp file after install

## Immediate Workaround
You can finish the installation now by running the agent setup manually:

```bash
# Skip to step 5 (FFmpeg) and 6 (agent setup) manually:
sudo apt-get install -y ffmpeg

# Create the agent directory and copy files
sudo mkdir -p /opt/lovable-agent /var/streaming
sudo python3 -m venv /opt/lovable-agent/venv
sudo /opt/lovable-agent/venv/bin/pip install supabase psutil
sudo cp ~/stream-heart-control/server-agent/agent.py /opt/lovable-agent/

# Create environment file
sudo tee /opt/lovable-agent/.env << EOF
SUPABASE_URL=https://jlrlhnxqdlkbiszzzcag.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscmxobnhxZGxrYmlzenp6Y2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzUzODIsImV4cCI6MjA4NDk1MTM4Mn0.7s9_RlXpK8Vz83Zd_A5a_Y2HVrjN6oqir_VbHgB53G8
SERVER_TOKEN=be53c1e4d3a504fa8957774a26051a8b60b89b2abd3d7bbcbec440dfcb522bc9
EOF
sudo chmod 600 /opt/lovable-agent/.env

# Create and start systemd service
sudo tee /etc/systemd/system/lovable-agent.service << 'EOF'
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
EOF

sudo systemctl daemon-reload
sudo systemctl enable lovable-agent
sudo systemctl start lovable-agent

# Check if it's running
sudo systemctl status lovable-agent
```

## Technical Notes
- **srt-live-transmit** is the only required tool for SRT→Multicast streaming
- **TSDuck** is only needed for future recording functionality
- **FFmpeg** is optional for re-encoding/container changes
- The core streaming will work even without TSDuck
