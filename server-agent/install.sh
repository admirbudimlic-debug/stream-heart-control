#!/bin/bash
#
# Lovable Streaming Server Agent - Installation Script
# Installs libsrt, tsduck, ffmpeg and the Python agent
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================================"
echo "  Lovable Streaming Server Agent - Installer"
echo "============================================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Check Ubuntu version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        echo -e "${YELLOW}Warning: This script is designed for Ubuntu. Continuing anyway...${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Could not detect OS. Continuing anyway...${NC}"
fi

# Configuration
INSTALL_DIR="/opt/lovable-agent"
BASE_PATH="/var/streaming"
SERVICE_NAME="lovable-agent"
SUPABASE_URL="${SUPABASE_URL:-https://jlrlhnxqdlkbiszzzcag.supabase.co}"
SUPABASE_KEY="${SUPABASE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscmxobnhxZGxrYmlzenp6Y2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzUzODIsImV4cCI6MjA4NDk1MTM4Mn0.7s9_RlXpK8Vz83Zd_A5a_Y2HVrjN6oqir_VbHgB53G8}"

# Parse arguments
SERVER_TOKEN=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --token)
            SERVER_TOKEN="$2"
            shift 2
            ;;
        --base-path)
            BASE_PATH="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

if [ -z "$SERVER_TOKEN" ]; then
    echo -e "${YELLOW}Usage: sudo ./install.sh --token <SERVER_TOKEN> [--base-path /var/streaming]${NC}"
    echo ""
    echo "Get your server token from the Lovable dashboard after adding a server."
    exit 1
fi

echo -e "${GREEN}Starting installation...${NC}"
echo ""

# Step 1: Update system
echo -e "${BLUE}[1/6] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Step 2: Install dependencies
echo -e "${BLUE}[2/6] Installing dependencies...${NC}"
apt-get install -y -qq \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    git \
    curl \
    wget \
    net-tools

# Step 3: Install libsrt and srt-tools
echo -e "${BLUE}[3/6] Installing libsrt and srt-live-transmit...${NC}"
apt-get install -y -qq libsrt-openssl-dev srt-tools || {
    echo -e "${YELLOW}srt-tools not in apt, building from source...${NC}"
    
    cd /tmp
    git clone https://github.com/Haivision/srt.git
    cd srt
    mkdir build && cd build
    cmake .. -DCMAKE_INSTALL_PREFIX=/usr/local
    make -j$(nproc)
    make install
    ldconfig
    cd /
    rm -rf /tmp/srt
}

# Verify srt-live-transmit is available
if ! command -v srt-live-transmit &> /dev/null; then
    echo -e "${RED}Error: srt-live-transmit not found after installation${NC}"
    exit 1
fi
echo -e "${GREEN}✓ srt-live-transmit installed: $(which srt-live-transmit)${NC}"

# Step 4: Install TSDuck (optional - for TS analysis)
echo -e "${BLUE}[4/6] Installing TSDuck (optional, for TS analysis)...${NC}"
if ! command -v tsp &> /dev/null; then
    # Try apt first (some Ubuntu versions have it)
    apt-get install -y -qq tsduck 2>/dev/null || {
        echo -e "${YELLOW}TSDuck not in apt, downloading from GitHub...${NC}"
        TSDUCK_VERSION="3.43-4549"
        
        # Detect architecture and Ubuntu version
        ARCH=$(dpkg --print-architecture)
        UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null | cut -d. -f1)
        
        # Default to ubuntu24 if can't detect
        [ -z "$UBUNTU_VERSION" ] && UBUNTU_VERSION="24"
        [ "$UBUNTU_VERSION" -lt 24 ] && UBUNTU_VERSION="24"
        [ "$UBUNTU_VERSION" -gt 25 ] && UBUNTU_VERSION="25"
        
        if [ "$ARCH" = "amd64" ]; then
            DEB_URL="https://github.com/tsduck/tsduck/releases/download/v${TSDUCK_VERSION}/tsduck_${TSDUCK_VERSION}.ubuntu${UBUNTU_VERSION}_amd64.deb"
        elif [ "$ARCH" = "arm64" ]; then
            DEB_URL="https://github.com/tsduck/tsduck/releases/download/v${TSDUCK_VERSION}/tsduck_${TSDUCK_VERSION}.ubuntu${UBUNTU_VERSION}_arm64.deb"
        else
            echo -e "${YELLOW}TSDuck: unsupported architecture $ARCH, skipping${NC}"
            DEB_URL=""
        fi
        
        if [ -n "$DEB_URL" ]; then
            echo -e "${BLUE}Downloading TSDuck for $ARCH (Ubuntu $UBUNTU_VERSION)...${NC}"
            wget -q "$DEB_URL" -O /tmp/tsduck.deb && \
            dpkg -i /tmp/tsduck.deb && \
            apt-get install -f -y -qq
            rm -f /tmp/tsduck.deb
        fi
    }
fi

if command -v tsp &> /dev/null; then
    echo -e "${GREEN}✓ TSDuck installed: $(which tsp)${NC}"
else
    echo -e "${YELLOW}⚠ TSDuck not installed (TS analysis features unavailable)${NC}"
fi

# Step 5: Install FFmpeg
echo -e "${BLUE}[5/6] Installing FFmpeg...${NC}"
apt-get install -y -qq ffmpeg
echo -e "${GREEN}✓ FFmpeg installed: $(which ffmpeg)${NC}"

# Step 6: Set up the agent
echo -e "${BLUE}[6/6] Setting up Lovable agent...${NC}"

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BASE_PATH"
chmod 755 "$BASE_PATH"

# Create Python virtual environment
python3 -m venv "$INSTALL_DIR/venv"
source "$INSTALL_DIR/venv/bin/activate"

# Install Python packages
pip install --upgrade pip -q
pip install supabase psutil -q

# Copy agent script from local directory (preferred) or download as fallback
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/agent.py" ]; then
    echo -e "${GREEN}Using local agent.py${NC}"
    cp "$SCRIPT_DIR/agent.py" "$INSTALL_DIR/agent.py"
else
    echo -e "${YELLOW}Local agent.py not found, downloading...${NC}"
    curl -sL "https://raw.githubusercontent.com/admirbudimlic-debug/stream-heart-control/main/server-agent/agent.py" -o "$INSTALL_DIR/agent.py" || {
        echo -e "${RED}Error: Could not download agent.py${NC}"
        echo -e "${RED}Please ensure agent.py is in the same directory as install.sh${NC}"
        exit 1
    }
fi

# Verify agent.py exists and is not empty
if [ ! -s "$INSTALL_DIR/agent.py" ]; then
    echo -e "${RED}Error: agent.py is empty or missing${NC}"
    exit 1
fi

# Create environment file
cat > "$INSTALL_DIR/.env" << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_KEY=$SUPABASE_KEY
SERVER_TOKEN=$SERVER_TOKEN
EOF
chmod 600 "$INSTALL_DIR/.env"

# Create systemd service
cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=Lovable Streaming Server Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Check status
sleep 2
if systemctl is-active --quiet $SERVICE_NAME; then
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo -e "  Agent Status:  ${GREEN}Running${NC}"
    echo -e "  Install Dir:   $INSTALL_DIR"
    echo -e "  Base Path:     $BASE_PATH"
    echo -e "  Service:       $SERVICE_NAME"
    echo ""
    echo -e "  Commands:"
    echo -e "    View logs:   ${BLUE}journalctl -u $SERVICE_NAME -f${NC}"
    echo -e "    Restart:     ${BLUE}systemctl restart $SERVICE_NAME${NC}"
    echo -e "    Stop:        ${BLUE}systemctl stop $SERVICE_NAME${NC}"
    echo ""
else
    echo -e "${RED}Warning: Service may not have started correctly${NC}"
    echo "Check logs with: journalctl -u $SERVICE_NAME -n 50"
fi
