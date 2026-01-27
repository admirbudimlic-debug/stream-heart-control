-- Add columns for storing last process output
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_output TEXT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_output_at TIMESTAMPTZ;