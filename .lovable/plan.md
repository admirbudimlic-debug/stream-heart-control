

# Plan: Fix Probe Workflow and Make UI Reactive

## Summary
Implement the missing `probe_stream` command in the Python agent to analyze SRT streams **before** starting multicast. This will make the "Probe → Select PIDs → Start" workflow functional.

---

## Phase 1: Implement probe_stream in Python Agent

### 1.1 Add probe_stream command handler
Add a new command handler in `agent.py` that:
- Connects to the SRT source using `srt-live-transmit` briefly (5-10 seconds)
- Pipes output to a temporary file or directly to `tsanalyze`
- Extracts PID metadata (service name, video/audio PIDs, codecs)
- Updates the channel's `ts_info` field in the database

### 1.2 Create _probe_stream method
```python
def _probe_stream(self, channel: dict) -> bool:
    """Probe SRT input to extract TS info without starting multicast"""
    srt_input = channel["srt_input"]
    channel_id = channel["id"]
    
    # Capture a few seconds of TS data to a temp file
    # Then analyze with tsanalyze
    # Update ts_info in database
```

### 1.3 Key technical approach
- Use `srt-live-transmit` with a short timeout to capture ~5 seconds of data to a temp file
- Run `tsanalyze --json` on the captured file
- Parse and store the result in `ts_info` column
- Clean up temp file

---

## Phase 2: Improve UI Responsiveness

### 2.1 Add realtime subscription for commands
Currently the UI shows "Probe command sent" but has no feedback when it completes. Add a listener for command status changes.

### 2.2 Show probe progress indicator
When probing is in progress, show a spinner on the channel card. When complete, the `ts_info` will populate via the existing realtime subscription.

### 2.3 Update isProbing state correctly
Track the actual command status rather than just the mutation pending state.

---

## Phase 3: Optional Future Enhancements

### 3.1 Switch to realtime for commands (optional)
Replace polling with Supabase realtime subscriptions for lower latency command processing. This would require:
- Adding the commands table to supabase_realtime publication
- Subscribing in the Python agent using supabase-py realtime

### 3.2 PID filtering integration
Pass selected PIDs to the start command so the agent can use TSDuck's `tsp` to filter streams before multicast output.

---

## Files to be Modified

| File | Changes |
|------|---------|
| `server-agent/agent.py` | Add `probe_stream` command handler and `_probe_stream` method |
| `src/hooks/useChannels.ts` | Add command status tracking |
| `src/components/dashboard/ChannelCard.tsx` | Improve probe loading state |

---

## Technical Details

### Probe Implementation in agent.py

```python
elif cmd_type == "probe_stream":
    ch_result = self.supabase.table("channels")\
        .select("*")\
        .eq("id", channel_id)\
        .single()\
        .execute()
    
    if ch_result.data:
        ts_info = self._probe_srt_stream(ch_result.data)
        if ts_info:
            self.supabase.table("channels").update({
                "ts_info": ts_info,
                "ts_analyzed_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", channel_id).execute()
            success = True
            result = ts_info
        else:
            error_msg = "Failed to analyze stream - check SRT connection"
    else:
        error_msg = "Channel not found"
```

### _probe_srt_stream Method

```python
def _probe_srt_stream(self, channel: dict) -> Optional[Dict[str, Any]]:
    """Probe SRT source directly without starting multicast"""
    srt_input = channel["srt_input"]
    channel_id = channel["id"]
    temp_file = f"/tmp/probe_{channel_id}.ts"
    
    try:
        # Capture 5 seconds of TS data
        cmd = ["timeout", "8", "srt-live-transmit", srt_input, f"file://con", "-v"]
        with open(temp_file, 'wb') as f:
            proc = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, timeout=12)
        
        # Analyze captured data
        result = subprocess.run(
            ["tsanalyze", temp_file, "--json"],
            capture_output=True, text=True, timeout=10
        )
        
        # Parse and return ts_info structure
        # ... (same parsing logic as _analyze_ts_stream)
        
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
```

---

## Expected Outcome

After implementation:
1. Click **Probe** → Agent connects to SRT, captures data, analyzes PIDs
2. Within 10-15 seconds, `ts_info` populates in the database
3. Realtime subscription updates the UI automatically
4. User sees all PIDs with checkboxes for MC/REC/XC
5. **Start** button becomes enabled
6. Click **Start** → Multicast begins

