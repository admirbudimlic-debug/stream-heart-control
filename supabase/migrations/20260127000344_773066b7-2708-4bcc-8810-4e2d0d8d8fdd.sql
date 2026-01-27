-- Add columns for TS stream information
ALTER TABLE public.channels 
  ADD COLUMN IF NOT EXISTS ts_info JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ts_analyzed_at TIMESTAMPTZ DEFAULT NULL;

-- ts_info will contain structure like:
-- {
--   "service_name": "My Channel",
--   "provider": "Broadcaster",
--   "pmt_pid": 256,
--   "pcr_pid": 257,
--   "video": [{"pid": 257, "codec": "H.264", "resolution": "1920x1080", "bitrate": 8500}],
--   "audio": [{"pid": 258, "codec": "AAC", "language": "eng", "bitrate": 192}],
--   "total_bitrate": 9500
-- }

COMMENT ON COLUMN public.channels.ts_info IS 'Transport stream analysis info (PIDs, codecs, service name)';