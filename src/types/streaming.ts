export type ServerStatus = 'online' | 'offline' | 'connecting';
export type ChannelStatus = 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
export type RecordingStatus = 'recording' | 'stopped' | 'processing' | 'completed' | 'error';
export type CommandStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Server {
  id: string;
  name: string;
  token: string;
  status: ServerStatus;
  last_seen_at: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_usage: number | null;
  disk_total_gb: number | null;
  disk_used_gb: number | null;
  base_path: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  folder_name: string;
  srt_input: string;
  multicast_output: string;
  status: ChannelStatus;
  pid: number | null;
  input_bitrate: number | null;
  output_bitrate: number | null;
  uptime_seconds: number | null;
  dropped_packets: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  server?: Server;
}

export interface Recording {
  id: string;
  channel_id: string;
  filename: string;
  filepath: string;
  status: RecordingStatus;
  started_at: string;
  stopped_at: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  mp4_filepath: string | null;
  error_message: string | null;
  created_at: string;
  channel?: Channel;
}

export interface Command {
  id: string;
  server_id: string;
  channel_id: string | null;
  command_type: string;
  payload: Record<string, unknown>;
  status: CommandStatus;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface ServerLog {
  id: string;
  server_id: string;
  channel_id: string | null;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}