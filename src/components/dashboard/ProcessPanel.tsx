import { Channel } from '@/types/streaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, Clock, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProcessPanelProps {
  channels: Channel[];
  isLoading?: boolean;
}

export function ProcessPanel({ channels, isLoading }: ProcessPanelProps) {
  const runningChannels = channels.filter(c => c.status === 'running' && c.pid);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading processes...
      </div>
    );
  }

  if (runningChannels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No running processes. Start a channel to see its process details.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-2">
        {runningChannels.map((channel) => (
          <Card key={channel.id} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{channel.name}</CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  PID: {channel.pid}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Process Command */}
              <div className="rounded bg-muted p-2">
                <p className="font-mono text-[10px] text-muted-foreground break-all">
                  srt-live-transmit "{channel.srt_input}" "udp://{channel.multicast_output}"
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {channel.uptime_seconds 
                      ? `${Math.floor(channel.uptime_seconds / 60)}m ${channel.uptime_seconds % 60}s`
                      : 'Starting...'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {channel.input_bitrate 
                      ? `${(Number(channel.input_bitrate) / 1000000).toFixed(1)} Mbps`
                      : '-- Mbps'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={cn(
                    channel.dropped_packets && channel.dropped_packets > 0 
                      ? "text-destructive" 
                      : ""
                  )}>
                    {channel.dropped_packets ?? 0} dropped
                  </span>
                </div>
              </div>

              {/* Last Output */}
              {(channel as any).last_output && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Last Output:</p>
                  <pre className="max-h-16 overflow-auto rounded bg-background p-2 font-mono text-[10px]">
                    {(channel as any).last_output}
                  </pre>
                  {(channel as any).last_output_at && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date((channel as any).last_output_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {channel.error_message && (
                <div className="rounded bg-destructive/10 p-2">
                  <p className="text-xs text-destructive">{channel.error_message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
