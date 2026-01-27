
# Add ARM64 Support for TSDuck Installation

## Problem
The installer fails to install TSDuck on ARM64 servers (AWS Graviton, Oracle Ampere, Raspberry Pi) because it only downloads the x86_64 (amd64) package.

## Solution
Update `server-agent/install.sh` to detect ARM64 architecture and download the appropriate Ubuntu ARM64 .deb package from GitHub releases.

## Implementation

### Update install.sh - TSDuck section (lines 118-143)

Replace the current architecture detection with support for both amd64 and arm64:

```bash
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
```

### Key Changes
| Change | Description |
|--------|-------------|
| ARM64 support | Downloads `arm64` package when architecture is detected |
| Version update | Uses TSDuck 3.43-4549 (latest with ARM64 support) |
| Ubuntu version detection | Automatically selects ubuntu24 or ubuntu25 package |
| Better logging | Shows which architecture and Ubuntu version is being used |

## Immediate Workaround

You can install TSDuck manually on your ARM64 server right now:

```bash
# Download and install TSDuck for ARM64 Ubuntu 24
wget -q "https://github.com/tsduck/tsduck/releases/download/v3.43-4549/tsduck_3.43-4549.ubuntu24_arm64.deb" -O /tmp/tsduck.deb
sudo dpkg -i /tmp/tsduck.deb
sudo apt-get install -f -y
rm /tmp/tsduck.deb

# Verify installation
tsp --version

# Restart the agent to enable TS analysis
sudo systemctl restart lovable-agent
```

## After Implementation

Once you approve this plan, pull the updated installer and the ARM64 package will be downloaded automatically on future installations. For your current server, use the manual workaround above.
