import { Channel, Recording } from '@/types/streaming';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Activity, Clock, AlertCircle, Circle, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChannelCardProps {
  channel: Channel;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  activeRecording?: Recording | null;
  isLoading?: boolean;
  isRecordingLoading?: boolean;
}

export function ChannelCard({ 
  channel, 
  onStart, 
  onStop, 
  onDelete, 
  onStartRecording,
  onStopRecording,
  activeRecording,
  isLoading,
  isRecordingLoading
}: ChannelCardProps) {
  const formatUptime = (seconds: number | null) => {
    if (!seconds) return '--:--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatBitrate = (kbps: number | null) => {
    if (!kbps) return '--';
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps.toFixed(0)} Kbps`;
  };

  // Parse bitrate from last_output if input_bitrate is not set
  const parseBitrateFromOutput = (lastOutput: string | null | undefined): number | null => {
    if (!lastOutput) return null;
    const match = lastOutput.match(/RECEIVING:\s+([\d.]+)/);
    if (match) {
      const mbps = parseFloat(match[1]);
      if (!isNaN(mbps) && mbps > 0) {
        return mbps * 1000;
      }
    }
    return null;
  };

  const effectiveInputBitrate = channel.input_bitrate ?? parseBitrateFromOutput(channel.last_output);
  const isRunning = channel.status === 'running';
  const hasActiveData = effectiveInputBitrate !== null && effectiveInputBitrate > 0;
  const isTransitioning = channel.status === 'starting' || channel.status === 'stopping';
  const isRecording = !!activeRecording;

  const getStatusBadge = () => {
    if (isRunning && hasActiveData) {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          LIVE
        </Badge>
      );
    }
    if (isRunning && !hasActiveData) {
      return (
        <Badge className="bg-warning text-warning-foreground gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          Waiting
        </Badge>
      );
    }
    if (channel.status === 'error') {
      return <Badge className="bg-destructive text-destructive-foreground">Error</Badge>;
    }
    if (isTransitioning) {
      return <Badge className="bg-warning text-warning-foreground">{channel.status}</Badge>;
    }
    return <Badge variant="secondary">Stopped</Badge>;
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {/* Name & Status */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{channel.name}</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* SRT Input */}
      <div className="flex flex-col gap-0.5 min-w-[200px]">
        <span className="text-[10px] uppercase text-muted-foreground">SRT Input</span>
        <code className={cn(
          "text-xs truncate max-w-[200px] rounded px-1.5 py-0.5",
          isRunning && !hasActiveData ? "bg-warning/20 text-warning" : "bg-muted"
        )}>
          {channel.srt_input.replace(/\?.*/, '')}
        </code>
      </div>

      {/* Multicast Output */}
      <div className="flex flex-col gap-0.5 min-w-[150px]">
        <span className="text-[10px] uppercase text-muted-foreground">Multicast</span>
        <code className={cn(
          "text-xs rounded px-1.5 py-0.5",
          isRunning && hasActiveData ? "bg-success/20 text-success" : "bg-muted"
        )}>
          {channel.multicast_output}
        </code>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1" title="Bitrate">
          <Activity className="h-3 w-3" />
          <span className="font-mono w-16">{formatBitrate(effectiveInputBitrate)}</span>
        </div>
        <div className="flex items-center gap-1" title="Uptime">
          <Clock className="h-3 w-3" />
          <span className="font-mono w-16">{formatUptime(channel.uptime_seconds)}</span>
        </div>
        <div className="flex items-center gap-1" title="Dropped">
          <AlertCircle className="h-3 w-3" />
          <span className="font-mono w-8">{channel.dropped_packets ?? 0}</span>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && activeRecording && (
        <div className="flex items-center gap-2 rounded bg-destructive/10 px-2 py-1">
          <Circle className="h-2 w-2 fill-destructive text-destructive animate-pulse" />
          <span className="text-xs text-destructive font-medium">REC</span>
          {activeRecording.file_size_bytes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              {(activeRecording.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              disabled={isLoading || isTransitioning}
              className="w-20"
            >
              <Square className="mr-1.5 h-3 w-3" />
              Stop
            </Button>
            
            {isRecording ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopRecording}
                disabled={isRecordingLoading}
                className="w-24"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop Rec
              </Button>
            ) : (
              onStartRecording && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartRecording}
                  disabled={isRecordingLoading}
                  className="w-24"
                >
                  <Circle className="h-3 w-3 fill-destructive text-destructive mr-1" />
                  Record
                </Button>
              )
            )}
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onStart}
            disabled={isLoading || isTransitioning}
            className="w-20"
          >
            <Play className="mr-1.5 h-3 w-3" />
            Start
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isLoading || isRecording}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
