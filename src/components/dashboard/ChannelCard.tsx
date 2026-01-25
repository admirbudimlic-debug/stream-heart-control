import { Channel } from '@/types/streaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Activity, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  channel: Channel;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function ChannelCard({ channel, onStart, onStop, onDelete, isLoading }: ChannelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-success text-success-foreground';
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

  const isRunning = channel.status === 'running';
  const isTransitioning = channel.status === 'starting' || channel.status === 'stopping';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{channel.name}</CardTitle>
          <Badge className={cn("text-xs", getStatusColor(channel.status))}>
            {channel.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stream Info */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SRT Input:</span>
            <code className="max-w-[200px] truncate text-xs">{channel.srt_input}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Multicast:</span>
            <code className="text-xs">{channel.multicast_output}</code>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-2 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span className="text-xs">Bitrate</span>
            </div>
            <div className="font-mono text-xs">{formatBitrate(channel.input_bitrate)}</div>
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
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}