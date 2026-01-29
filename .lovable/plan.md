# Plan: Fix Probe Workflow and Make UI Reactive

## ✅ COMPLETED

### Phase 1: Implement probe_stream in Python Agent ✅
- Added `probe_stream` command handler in `_process_command()`
- Created `_probe_srt_stream()` method that:
  - Captures 5-8 seconds of TS data from SRT source to temp file
  - Runs `tsanalyze --json` on captured data
  - Parses and stores PIDs in `ts_info` column
  - Cleans up temp file
- Refactored `_analyze_ts_stream()` to use shared `_parse_ts_json()` method

### Phase 2: Improve UI Responsiveness ✅
- Added `useProbingChannels()` hook with realtime subscription for commands table
- Tracks probe status per-channel via command status changes
- Shows accurate loading state (not just mutation pending)
- Realtime updates when probe completes via existing channels subscription

---

## How It Works Now

1. **Click Probe** → Sends `probe_stream` command to database
2. **Agent picks up command** → Captures SRT data, analyzes with TSDuck
3. **Agent updates `ts_info`** → Realtime subscription updates UI
4. **UI shows PIDs** → Start button becomes enabled
5. **Click Start** → Multicast begins

---

## Files Modified

| File | Changes |
|------|---------|
| `server-agent/agent.py` | Added `probe_stream` handler, `_probe_srt_stream()`, refactored TS parsing |
| `src/hooks/useChannels.ts` | Added `useProbingChannels()` hook with realtime tracking |
| `src/pages/Dashboard.tsx` | Integrated probe state tracking, better toast messages |

---

## To Test

1. Update agent on server: copy new `agent.py` and restart `lovable-agent` service
2. Click "Probe" on a channel with valid SRT source
3. Watch logs for "Probing SRT stream" message
4. After 10-15 seconds, `ts_info` should populate
5. Start button becomes enabled

