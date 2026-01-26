#!/bin/bash
#
# Root-level installer wrapper
# Delegates to server-agent/install.sh
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/server-agent/install.sh" ]; then
    echo "Error: server-agent/install.sh not found"
    echo "Make sure you cloned the full repository"
    exit 1
fi

exec /bin/bash "$SCRIPT_DIR/server-agent/install.sh" "$@"
