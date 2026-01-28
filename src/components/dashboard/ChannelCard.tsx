import { Channel, Recording } from '@/types/streaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Activity, Clock, AlertCircle, Video, Volume2, Info, Circle, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const getStatusColor = (status: string, hasData: boolean) => {
    switch (status) {
      case 'running':
        // Only show green if actually receiving data
        return hasData ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground';
      case 'starting':
      case 'stopping':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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
  // Looks for patterns like "RECEIVING:      16.2066" (in Mbps)
  const parseBitrateFromOutput = (lastOutput: string | null | undefined): number | null => {
    if (!lastOutput) return null;
    const match = lastOutput.match(/RECEIVING:\s+([\d.]+)/);
    if (match) {
      const mbps = parseFloat(match[1]);
      if (!isNaN(mbps) && mbps > 0) {
        return mbps * 1000; // Convert Mbps to Kbps for formatBitrate
      }
    }
    return null;
  };

  // Get the effective input bitrate - from DB or parsed from last_output
  const effectiveInputBitrate = channel.input_bitrate ?? parseBitrateFromOutput(channel.last_output);

  const isRunning = channel.status === 'running';
  const hasActiveData = effectiveInputBitrate !== null && effectiveInputBitrate > 0;
  const isTransitioning = channel.status === 'starting' || channel.status === 'stopping';
  const tsInfo = channel.ts_info;
  const isRecording = !!activeRecording;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-base font-medium">{channel.name}</CardTitle>
            {tsInfo?.service_name && (
              <span className="text-xs text-muted-foreground">{tsInfo.service_name}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isRecording && (
              <Badge className="bg-destructive text-destructive-foreground gap-1">
                <Circle className="h-2 w-2 fill-current animate-pulse" />
                REC
              </Badge>
            )}
            <Badge className={cn("text-xs", getStatusColor(channel.status, hasActiveData))}>
              {isRunning && !hasActiveData ? 'waiting' : channel.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Multicast Output - Only show green LIVE when actually receiving data */}
        {isRunning && hasActiveData && (
          <div className="flex items-center justify-between rounded-md bg-success/10 p-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span className="font-medium text-success">LIVE</span>
            </div>
            <code className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
              {channel.multicast_output}
            </code>
          </div>
        )}
        
        {/* Waiting for connection indicator */}
        {isRunning && !hasActiveData && (
          <div className="flex items-center justify-between rounded-md bg-warning/10 p-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
              <span className="font-medium text-warning">Waiting for SRT connection...</span>
            </div>
            <code className="rounded bg-muted px-2 py-0.5 text-xs">
              {channel.multicast_output}
            </code>
          </div>
        )}

        {/* Active Recording Indicator with Progress */}
        {isRecording && activeRecording && (
          <div className="rounded-md bg-destructive/10 p-2 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Circle className="h-2 w-2 fill-destructive text-destructive animate-pulse" />
                <span className="font-medium text-destructive">Recording</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Started {formatDistanceToNow(new Date(activeRecording.started_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <code className="rounded bg-muted px-2 py-0.5 truncate max-w-[200px]">
                {activeRecording.filename}
              </code>
              {activeRecording.file_size_bytes && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  {(activeRecording.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Saving to: <code className="text-[10px]">{activeRecording.filepath}</code>
            </div>
          </div>
        )}

        {/* TS Stream PIDs - Video/Audio when running */}
        {isRunning && tsInfo && (tsInfo.video?.length > 0 || tsInfo.audio?.length > 0) && (
          <div className="rounded-md border bg-card p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Transport Stream PIDs</span>
              {tsInfo.provider && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Provider: {tsInfo.provider}</p>
                      {tsInfo.pmt_pid && <p>PMT PID: {tsInfo.pmt_pid}</p>}
                      {tsInfo.pcr_pid && <p>PCR PID: {tsInfo.pcr_pid}</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Video PIDs */}
            {tsInfo.video?.map((v, i) => (
              <div key={`video-${i}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Video className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Video</span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono">
                    PID {v.pid}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>{v.codec}</span>
                  {v.resolution && <span>• {v.resolution}</span>}
                  {v.bitrate && <span>• {formatBitrate(v.bitrate)}</span>}
                </div>
              </div>
            ))}
            
            {/* Audio PIDs */}
            {tsInfo.audio?.map((a, i) => (
              <div key={`audio-${i}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Audio</span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono">
                    PID {a.pid}
                  </Badge>
                  {a.language && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] uppercase">
                      {a.language}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>{a.codec}</span>
                  {a.bitrate && <span>• {formatBitrate(a.bitrate)}</span>}
                </div>
              </div>
            ))}
            
            {/* Total Bitrate */}
            {tsInfo.total_bitrate && (
              <div className="flex items-center justify-between text-xs pt-1 border-t">
                <span className="text-muted-foreground">Total Bitrate</span>
                <span className="font-mono font-medium">{formatBitrate(tsInfo.total_bitrate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Stream Info (when not running or no TS info yet) */}
        {(!isRunning || !tsInfo) && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SRT Input:</span>
              <code className="max-w-[200px] truncate text-xs">{channel.srt_input}</code>
            </div>
            {!isRunning && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multicast:</span>
                <code className="text-xs">{channel.multicast_output}</code>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-2 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span className="text-xs">Bitrate</span>
            </div>
            <div className="font-mono text-xs">{formatBitrate(effectiveInputBitrate)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">Uptime</span>
            </div>
            <div className="font-mono text-xs">{formatUptime(channel.uptime_seconds)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Dropped</span>
            </div>
            <div className="font-mono text-xs">{channel.dropped_packets ?? 0}</div>
          </div>
        </div>

        {/* Error Message */}
        {channel.error_message && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {channel.error_message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onStop}
                disabled={isLoading || isTransitioning}
              >
                <Square className="mr-1.5 h-3 w-3" />
                Stop
              </Button>
              
              {/* Recording Controls - Simple toggle */}
              {isRecording ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onStopRecording}
                  disabled={isRecordingLoading}
                  className="gap-1.5"
                >
                  <Square className="h-3 w-3" />
                  Stop Rec
                </Button>
              ) : (
                onStartRecording && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStartRecording}
                    disabled={isRecordingLoading}
                    className="gap-1.5"
                  >
                    <Circle className="h-3 w-3 fill-destructive text-destructive" />
                    Record
                  </Button>
                )
              )}
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onStart}
              disabled={isLoading || isTransitioning}
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
      </CardContent>
    </Card>
  );
}
