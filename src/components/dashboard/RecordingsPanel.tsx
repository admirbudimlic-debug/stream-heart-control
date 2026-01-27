import { Recording, Channel } from '@/types/streaming';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RewrapDialog } from './RewrapDialog';
import { 
  Circle, 
  FileVideo, 
  Trash2, 
  Clock, 
  HardDrive,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecordingsPanelProps {
  recordings: Recording[];
  channels: Channel[];
  isLoading?: boolean;
  onRewrap: (recording: Recording, outputFilename: string) => void;
  onDelete: (id: string) => void;
  rewrapLoading?: boolean;
}

export function RecordingsPanel({ 
  recordings, 
  channels, 
  isLoading, 
  onRewrap,
  onDelete,
  rewrapLoading
}: RecordingsPanelProps) {
  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name ?? 'Unknown Channel';
  };

  const getChannelServerId = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.server_id ?? '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recording':
        return (
          <Badge className="bg-destructive text-destructive-foreground gap-1">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            Recording
          </Badge>
        );
      case 'stopped':
        return (
          <Badge variant="secondary" className="gap-1">
            <Circle className="h-2 w-2" />
            Stopped
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-warning text-warning-foreground gap-1">
            <Loader2 className="h-2 w-2 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-success text-success-foreground gap-1">
            <CheckCircle className="h-2 w-2" />
            Completed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-2 w-2" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <FileVideo className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No recordings yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a recording from any running channel
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 pr-4">
        {recordings.map((recording) => (
          <Card key={recording.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{recording.filename}</span>
                    {getStatusBadge(recording.status)}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    Channel: {getChannelName(recording.channel_id)}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(recording.duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(recording.file_size_bytes)}
                    </span>
                    <span>
                      Started {formatDistanceToNow(new Date(recording.started_at), { addSuffix: true })}
                    </span>
                  </div>

                  {recording.mp4_filepath && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      MP4: {recording.mp4_filepath.split('/').pop()}
                    </div>
                  )}

                  {recording.error_message && (
                    <div className="mt-2 text-xs text-destructive">
                      {recording.error_message}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {(recording.status === 'stopped' || recording.status === 'completed') && !recording.mp4_filepath && (
                    <RewrapDialog
                      recording={recording}
                      onRewrap={(outputFilename) => onRewrap(recording, outputFilename)}
                      isLoading={rewrapLoading}
                    />
                  )}
                  
                  {recording.status !== 'recording' && recording.status !== 'processing' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(recording.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
