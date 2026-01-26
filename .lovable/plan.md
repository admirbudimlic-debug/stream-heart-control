
Goal: get the server-agent installer running on your Ubuntu box, and make the installer more robust so this “sudo: ./install.sh: command not found” can’t happen again.

## What’s happening (root cause)
When you run `sudo ./install.sh`, `sudo` tries to execute the file directly via the kernel.
If the file exists and is executable but the **shebang interpreter path can’t be resolved**, `sudo` often reports:
- `sudo: ./install.sh: command not found`

The most common reason is **Windows line endings (CRLF)** in the script, which turns the shebang into `#!/bin/bash\r` (the `\r` makes the path invalid).

Your earlier attempts also included `sudo install.sh ...` (without `./`) which will always fail unless `install.sh` is in `$PATH`. But the key issue is: even `sudo ./install.sh` fails, so it’s almost certainly the interpreter/line-ending problem.

## Immediate fix steps on your machine (no code changes needed)

### 1) Confirm you’re in the right folder and the file is executable
Run:
```bash
cd ~/stream-heart-control/server-agent
pwd
ls -la install.sh
```
You should see something like `-rwxr-xr-x ... install.sh`.

### 2) Detect CRLF / broken shebang
Run:
```bash
file install.sh
head -n 1 install.sh | cat -A
```
If you see `CRLF` in `file` output, or `^M` at the end of the first line from `cat -A`, that’s the problem.

### 3) Convert line endings to Unix and retry
Option A (recommended):
```bash
sudo apt-get update
sudo apt-get install -y dos2unix
dos2unix install.sh
dos2unix agent.py
chmod +x install.sh
sudo ./install.sh --token YOUR_TOKEN_HERE
```

Option B (no extra package):
```bash
sed -i 's/\r$//' install.sh
sed -i 's/\r$//' agent.py
chmod +x install.sh
sudo ./install.sh --token YOUR_TOKEN_HERE
```

### 4) If it still fails, bypass shebang completely (diagnostic + workaround)
This forces bash to run the script regardless of shebang issues:
```bash
sudo /bin/bash ./install.sh --token YOUR_TOKEN_HERE
```
If this works, the problem is definitely with how the script is being executed (shebang/format), not with the script logic.

### 5) After install, verify the agent is running
```bash
sudo systemctl status lovable-agent --no-pager
sudo journalctl -u lovable-agent -n 100 --no-pager
```

## Multicast scheme confirmation
You want:
- server 12, channel 6 → `239.1.12.6:5000`

That scheme is the intended one: `239.1.[server_number].[channel_number]:5000`.
(We’ll also keep TTL/pkt_size options on the UDP output, since they don’t alter the MPEG-TS payload.)

## Follow-up improvements I will implement in the codebase (once you approve switching back to edit mode)
These are not required to fix your immediate issue, but they’ll prevent future installer breakage and avoid pulling the wrong agent code:

1) Make the installer not depend on a different GitHub repo
- Current `server-agent/install.sh` tries to download `agent.py` from `lovable/streaming-agent` and also contains an empty heredoc placeholder.
- Change it to prefer **the local `server-agent/agent.py`** (the one in this repo) and only fall back to downloading from *this* repo if needed.

2) Add a repo-level convenience installer (optional)
- Add a root `install.sh` wrapper that just runs `server-agent/install.sh`.
- This prevents the common mistake of running install from the repo root.

3) Enforce Unix line endings in git
- Add `.gitattributes` to force LF endings for `*.sh` and `*.py`.
- This prevents CRLF from reappearing on different machines.

4) Update the server-agent README “Quick Install” section
- Ensure instructions match the actual repo layout (run from `server-agent/` or use the new wrapper).

## If you want the fastest next step
Run this exact sequence:
```bash
cd ~/stream-heart-control/server-agent
file install.sh
sed -i 's/\r$//' install.sh
chmod +x install.sh
sudo /bin/bash ./install.sh --token YOUR_TOKEN_HERE
```
If it works, we’ll then do the codebase hardening steps above so it works with `sudo ./install.sh` everywhere, consistently.
