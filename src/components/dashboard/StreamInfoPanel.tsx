import { useState } from 'react';
import { TsInfo } from '@/types/streaming';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamInfoPanelProps {
  tsInfo: TsInfo | null;
  isRunning: boolean;
  isRecording: boolean;
  onStartMulticast?: (pids: number[]) => void;
  onStopMulticast?: () => void;
  onStartRecording?: (pids: number[]) => void;
  onStopRecording?: () => void;
  isMulticastLoading?: boolean;
  isRecordingLoading?: boolean;
}

interface PidRow {
  type: 'video' | 'audio';
  pid: number;
  label: string;
  details: string;
  mcEnabled: boolean;
  recEnabled: boolean;
  xcEnabled: boolean;
}

export function StreamInfoPanel({ 
  tsInfo, 
  isRunning,
  isRecording,
  onStartMulticast,
  onStopMulticast,
  onStartRecording,
  onStopRecording,
  isMulticastLoading,
  isRecordingLoading
}: StreamInfoPanelProps) {
  const [pidSelections, setPidSelections] = useState<Record<number, { mc: boolean; rec: boolean; xc: boolean }>>({});

  const formatPid = (pid: number) => {
    return `${pid} (0x${pid.toString(16).toUpperCase().padStart(4, '0')})`;
  };

  const getSelection = (pid: number) => {
    return pidSelections[pid] || { mc: true, rec: true, xc: false };
  };

  const toggleSelection = (pid: number, field: 'mc' | 'rec' | 'xc') => {
    setPidSelections(prev => ({
      ...prev,
      [pid]: {
        ...getSelection(pid),
        [field]: !getSelection(pid)[field]
      }
    }));
  };

  const getSelectedPids = (field: 'mc' | 'rec') => {
    const allPids = [
      ...(tsInfo?.video.map(v => v.pid) || []),
      ...(tsInfo?.audio.map(a => a.pid) || [])
    ];
    return allPids.filter(pid => getSelection(pid)[field]);
  };

  if (!tsInfo) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        {isRunning ? 'Analyzing stream... waiting for TS data' : 'Start channel to analyze stream'}
      </div>
    );
  }

  const hasStreams = tsInfo.video.length > 0 || tsInfo.audio.length > 0;

  if (!hasStreams) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        No video/audio streams detected in transport stream
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card text-sm">
      {/* Service Info Header */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Service Name:</span>
            <span className="font-medium">{tsInfo.service_name || 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-medium">{tsInfo.provider || 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">PMT PID:</span>
            <span className="font-mono">{tsInfo.pmt_pid ? formatPid(tsInfo.pmt_pid) : 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">PCR PID:</span>
            <span className="font-mono">{tsInfo.pcr_pid ? formatPid(tsInfo.pcr_pid) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* PID Table */}
      <div className="px-4 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground border-b">
              <th className="text-left py-2 font-medium">Stream</th>
              <th className="text-left py-2 font-medium">PID</th>
              <th className="text-left py-2 font-medium">Codec / Details</th>
              <th className="text-center py-2 font-medium w-20">
                <div className="flex flex-col items-center">
                  <span>MC</span>
                  <span className="text-[10px] normal-case text-muted-foreground">Multicast</span>
                </div>
              </th>
              <th className="text-center py-2 font-medium w-20">
                <div className="flex flex-col items-center">
                  <span>REC</span>
                  <span className="text-[10px] normal-case text-muted-foreground">Record</span>
                </div>
              </th>
              <th className="text-center py-2 font-medium w-20">
                <div className="flex flex-col items-center">
                  <span>XC</span>
                  <span className="text-[10px] normal-case text-muted-foreground">Transcode</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Video Streams */}
            {tsInfo.video.map((v, idx) => {
              const sel = getSelection(v.pid);
              return (
                <tr key={`video-${v.pid}-${idx}`} className="border-b border-border/50">
                  <td className="py-2">
                    <Badge variant="secondary" className="text-xs">
                      Video {tsInfo.video.length > 1 ? idx + 1 : ''}
                    </Badge>
                  </td>
                  <td className="py-2 font-mono text-xs">{formatPid(v.pid)}</td>
                  <td className="py-2 text-muted-foreground">
                    {v.codec}
                    {v.resolution && ` • ${v.resolution}`}
                    {v.bitrate && ` • ${(v.bitrate / 1000).toFixed(0)} kb/s`}
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.mc ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 w-7 p-0", sel.mc && "bg-primary")}
                      onClick={() => toggleSelection(v.pid, 'mc')}
                    >
                      {sel.mc ? <Play className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    </Button>
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.rec ? "destructive" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSelection(v.pid, 'rec')}
                    >
                      <Circle className={cn("h-3 w-3", sel.rec && "fill-current")} />
                    </Button>
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.xc ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSelection(v.pid, 'xc')}
                      disabled
                      title="Transcode coming soon"
                    >
                      <span className="text-xs font-medium">XC</span>
                    </Button>
                  </td>
                </tr>
              );
            })}

            {/* Audio Streams */}
            {tsInfo.audio.map((a, idx) => {
              const sel = getSelection(a.pid);
              return (
                <tr key={`audio-${a.pid}-${idx}`} className="border-b border-border/50 last:border-b-0">
                  <td className="py-2">
                    <Badge variant="outline" className="text-xs">
                      Audio {idx + 1}
                    </Badge>
                  </td>
                  <td className="py-2 font-mono text-xs">{formatPid(a.pid)}</td>
                  <td className="py-2 text-muted-foreground">
                    {a.codec}
                    {a.language && ` • ${a.language}`}
                    {a.bitrate && ` • ${a.bitrate} kb/s`}
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.mc ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 w-7 p-0", sel.mc && "bg-primary")}
                      onClick={() => toggleSelection(a.pid, 'mc')}
                    >
                      {sel.mc ? <Play className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    </Button>
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.rec ? "destructive" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSelection(a.pid, 'rec')}
                    >
                      <Circle className={cn("h-3 w-3", sel.rec && "fill-current")} />
                    </Button>
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      variant={sel.xc ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSelection(a.pid, 'xc')}
                      disabled
                      title="Transcode coming soon"
                    >
                      <span className="text-xs font-medium">XC</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {tsInfo.total_bitrate && (
            <span>Total Bitrate: {(tsInfo.total_bitrate / 1000000).toFixed(2)} Mbps</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Multicast Action */}
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopMulticast}
              disabled={isMulticastLoading}
            >
              <Square className="h-3 w-3 mr-1.5" />
              Stop Multicast
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStartMulticast?.(getSelectedPids('mc'))}
              disabled={isMulticastLoading || getSelectedPids('mc').length === 0}
            >
              <Play className="h-3 w-3 mr-1.5" />
              Start Multicast ({getSelectedPids('mc').length} PIDs)
            </Button>
          )}

          {/* Recording Action */}
          {isRecording ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopRecording}
              disabled={isRecordingLoading}
            >
              <Square className="h-3 w-3 mr-1.5" />
              Stop Recording
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartRecording?.(getSelectedPids('rec'))}
              disabled={isRecordingLoading || !isRunning || getSelectedPids('rec').length === 0}
            >
              <Circle className="h-3 w-3 fill-destructive text-destructive mr-1.5" />
              Record ({getSelectedPids('rec').length} PIDs)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
