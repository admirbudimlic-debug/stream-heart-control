-- Create enum for server status
CREATE TYPE public.server_status AS ENUM ('online', 'offline', 'connecting');

-- Create enum for channel status  
CREATE TYPE public.channel_status AS ENUM ('running', 'stopped', 'error', 'starting', 'stopping');

-- Create enum for recording status
CREATE TYPE public.recording_status AS ENUM ('recording', 'stopped', 'processing', 'completed', 'error');

-- Create enum for command status
CREATE TYPE public.command_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Servers table - each physical Ubuntu server
CREATE TABLE public.servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status server_status NOT NULL DEFAULT 'offline',
    last_seen_at TIMESTAMP WITH TIME ZONE,
    cpu_usage NUMERIC(5,2),
    memory_usage NUMERIC(5,2),
    disk_usage NUMERIC(5,2),
    disk_total_gb NUMERIC(10,2),
    disk_used_gb NUMERIC(10,2),
    base_path TEXT DEFAULT '/var/streaming',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Channels table - individual streaming channels
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    srt_input TEXT NOT NULL,
    multicast_output TEXT NOT NULL,
    status channel_status NOT NULL DEFAULT 'stopped',
    pid INTEGER,
    input_bitrate NUMERIC(10,2),
    output_bitrate NUMERIC(10,2),
    uptime_seconds INTEGER DEFAULT 0,
    dropped_packets INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recordings table - recording sessions
CREATE TABLE public.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    status recording_status NOT NULL DEFAULT 'recording',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    mp4_filepath TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commands table - command queue for servers
CREATE TABLE public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    command_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    status command_status NOT NULL DEFAULT 'pending',
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Server logs table
CREATE TABLE public.server_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_logs ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for agent access via token - no auth required)
-- In production, you'd want more restrictive policies

-- Servers: Anyone can read (dashboard), agents update their own via token
CREATE POLICY "Allow public read for servers" ON public.servers
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for servers" ON public.servers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for servers" ON public.servers
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for servers" ON public.servers
    FOR DELETE USING (true);

-- Channels: Public access for management
CREATE POLICY "Allow public read for channels" ON public.channels
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for channels" ON public.channels
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for channels" ON public.channels
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for channels" ON public.channels
    FOR DELETE USING (true);

-- Recordings: Public access
CREATE POLICY "Allow public read for recordings" ON public.recordings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for recordings" ON public.recordings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for recordings" ON public.recordings
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for recordings" ON public.recordings
    FOR DELETE USING (true);

-- Commands: Public access for command queue
CREATE POLICY "Allow public read for commands" ON public.commands
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for commands" ON public.commands
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for commands" ON public.commands
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for commands" ON public.commands
    FOR DELETE USING (true);

-- Server logs: Public access
CREATE POLICY "Allow public read for server_logs" ON public.server_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for server_logs" ON public.server_logs
    FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON public.servers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recordings;

-- Create indexes for performance
CREATE INDEX idx_channels_server_id ON public.channels(server_id);
CREATE INDEX idx_recordings_channel_id ON public.recordings(channel_id);
CREATE INDEX idx_commands_server_id ON public.commands(server_id);
CREATE INDEX idx_commands_status ON public.commands(status);
CREATE INDEX idx_server_logs_server_id ON public.server_logs(server_id);
CREATE INDEX idx_server_logs_created_at ON public.server_logs(created_at DESC);