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
  const effectiveOutputBitrate = channel.output_bitrate;
  const isRunning = channel.status === 'running';
  const hasInputData = effectiveInputBitrate !== null && effectiveInputBitrate > 0;
  const hasOutputData = effectiveOutputBitrate !== null && effectiveOutputBitrate > 0;
  const isTransitioning = channel.status === 'starting' || channel.status === 'stopping';
  const isRecording = !!activeRecording;

  const getStatusBadge = () => {
    if (isRunning && hasInputData && hasOutputData) {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          LIVE
        </Badge>
      );
    }
    if (isRunning && (!hasInputData || !hasOutputData)) {
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
    <div className="flex items-center gap-6 rounded-lg border bg-card p-4">
      {/* Name, Status & Control Button */}
      <div className="flex flex-col gap-2 min-w-[140px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{channel.name}</span>
          {getStatusBadge()}
        </div>
        {isRunning ? (
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
      </div>

      {/* SRT Input with metrics below */}
      <div className="flex flex-col gap-1 min-w-[220px]">
        <span className="text-[10px] uppercase text-muted-foreground">SRT Input</span>
        <code className={cn(
          "text-xs truncate max-w-[220px] rounded px-1.5 py-0.5",
          isRunning && hasInputData ? "bg-success/20 text-success" : 
          isRunning && !hasInputData ? "bg-warning/20 text-warning" : "bg-muted"
        )}>
          {channel.srt_input.replace(/\?.*/, '')}
        </code>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1" title="Input Bitrate">
            <Activity className="h-3 w-3" />
            <span className="font-mono">{formatBitrate(effectiveInputBitrate)}</span>
          </div>
          <div className="flex items-center gap-1" title="Dropped Packets">
            <AlertCircle className="h-3 w-3" />
            <span className="font-mono">{channel.dropped_packets ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Multicast Output with uptime below */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <span className="text-[10px] uppercase text-muted-foreground">Multicast Output</span>
        <code className={cn(
          "text-xs rounded px-1.5 py-0.5",
          isRunning && hasOutputData ? "bg-success/20 text-success" : 
          isRunning && !hasOutputData ? "bg-warning/20 text-warning" : "bg-muted"
        )}>
          {channel.multicast_output}
        </code>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1" title="Uptime">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{formatUptime(channel.uptime_seconds)}</span>
        </div>
      </div>

      {/* Recording Button & Indicator */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        {isRecording ? (
          <>
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
            {activeRecording?.file_size_bytes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                {(activeRecording.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </>
        ) : (
          onStartRecording && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartRecording}
              disabled={isRecordingLoading || !isRunning}
              className="w-24"
            >
              <Circle className="h-3 w-3 fill-destructive text-destructive mr-1" />
              Record
            </Button>
          )
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete Action */}
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
  );
}
