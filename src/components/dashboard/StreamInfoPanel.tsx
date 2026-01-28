import { useState, useEffect } from 'react';
import { TsInfo } from '@/types/streaming';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PidSelection {
  pid: number;
  multicast: boolean;
  record: boolean;
  transcode: boolean;
}

interface StreamInfoPanelProps {
  tsInfo: TsInfo | null;
  isRunning: boolean;
  onSelectionChange?: (selections: PidSelection[]) => void;
}

export function StreamInfoPanel({ tsInfo, isRunning, onSelectionChange }: StreamInfoPanelProps) {
  const [selections, setSelections] = useState<PidSelection[]>([]);

  // Initialize selections when tsInfo changes
  useEffect(() => {
    if (!tsInfo) {
      setSelections([]);
      return;
    }

    const allPids: PidSelection[] = [
      ...tsInfo.video.map(v => ({
        pid: v.pid,
        multicast: true,
        record: true,
        transcode: false,
      })),
      ...tsInfo.audio.map(a => ({
        pid: a.pid,
        multicast: true,
        record: true,
        transcode: false,
      })),
    ];
    
    setSelections(allPids);
  }, [tsInfo]);

  const toggleSelection = (pid: number, field: 'multicast' | 'record' | 'transcode') => {
    const updated = selections.map(s => 
      s.pid === pid ? { ...s, [field]: !s[field] } : s
    );
    setSelections(updated);
    onSelectionChange?.(updated);
  };

  const getSelection = (pid: number) => {
    return selections.find(s => s.pid === pid) || { pid, multicast: true, record: true, transcode: false };
  };

  const formatPid = (pid: number) => {
    const hex = pid.toString(16).toUpperCase().padStart(4, '0');
    return `${pid} (0x${hex})`;
  };

  if (!tsInfo) {
    return (
      <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
        {isRunning ? 'Analyzing stream...' : 'Start channel to analyze stream'}
      </div>
    );
  }

  const hasStreams = tsInfo.video.length > 0 || tsInfo.audio.length > 0;

  if (!hasStreams) {
    return (
      <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
        No streams detected
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-2 text-xs">
      {/* Service Info Header */}
      {(tsInfo.service_name || tsInfo.provider) && (
        <div className="mb-2 flex items-center gap-2 border-b border-border/50 pb-2">
          <Badge variant="outline" className="text-[10px] font-normal">
            Service
          </Badge>
          <span className="font-medium">{tsInfo.service_name || 'Unknown'}</span>
          {tsInfo.provider && (
            <span className="text-muted-foreground">({tsInfo.provider})</span>
          )}
        </div>
      )}

      {/* Stream Table */}
      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase text-muted-foreground">
            <th className="text-left font-medium pb-1">Stream</th>
            <th className="text-left font-medium pb-1">PID</th>
            <th className="text-left font-medium pb-1">Details</th>
            <th className="text-center font-medium pb-1 w-12">MC</th>
            <th className="text-center font-medium pb-1 w-12">REC</th>
            <th className="text-center font-medium pb-1 w-12">XC</th>
          </tr>
        </thead>
        <tbody>
          {/* Video Streams */}
          {tsInfo.video.map((v, idx) => {
            const sel = getSelection(v.pid);
            return (
              <tr key={`video-${v.pid}-${idx}`} className="border-t border-border/30">
                <td className="py-1">
                  <Badge variant="secondary" className="text-[10px]">
                    Video
                  </Badge>
                </td>
                <td className="py-1 font-mono text-[11px]">{formatPid(v.pid)}</td>
                <td className="py-1">
                  <span className="text-muted-foreground">
                    {v.codec}
                    {v.resolution && `, ${v.resolution}`}
                    {v.bitrate && `, ${(v.bitrate / 1000).toFixed(0)}kb/s`}
                  </span>
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.multicast}
                    onCheckedChange={() => toggleSelection(v.pid, 'multicast')}
                    className="h-3.5 w-3.5"
                  />
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.record}
                    onCheckedChange={() => toggleSelection(v.pid, 'record')}
                    className="h-3.5 w-3.5"
                  />
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.transcode}
                    onCheckedChange={() => toggleSelection(v.pid, 'transcode')}
                    className="h-3.5 w-3.5"
                  />
                </td>
              </tr>
            );
          })}

          {/* Audio Streams */}
          {tsInfo.audio.map((a, idx) => {
            const sel = getSelection(a.pid);
            return (
              <tr key={`audio-${a.pid}-${idx}`} className="border-t border-border/30">
                <td className="py-1">
                  <Badge variant="outline" className="text-[10px]">
                    Audio
                  </Badge>
                </td>
                <td className="py-1 font-mono text-[11px]">{formatPid(a.pid)}</td>
                <td className="py-1">
                  <span className="text-muted-foreground">
                    {a.codec}
                    {a.language && `, ${a.language}`}
                    {a.bitrate && `, ${a.bitrate}kb/s`}
                  </span>
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.multicast}
                    onCheckedChange={() => toggleSelection(a.pid, 'multicast')}
                    className="h-3.5 w-3.5"
                  />
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.record}
                    onCheckedChange={() => toggleSelection(a.pid, 'record')}
                    className="h-3.5 w-3.5"
                  />
                </td>
                <td className="py-1 text-center">
                  <Checkbox
                    checked={sel.transcode}
                    onCheckedChange={() => toggleSelection(a.pid, 'transcode')}
                    className="h-3.5 w-3.5"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer with PMT/PCR info */}
      {(tsInfo.pmt_pid || tsInfo.pcr_pid || tsInfo.total_bitrate) && (
        <div className="mt-2 flex items-center gap-3 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          {tsInfo.pmt_pid && <span>PMT: {formatPid(tsInfo.pmt_pid)}</span>}
          {tsInfo.pcr_pid && <span>PCR: {formatPid(tsInfo.pcr_pid)}</span>}
          {tsInfo.total_bitrate && (
            <span>Total: {(tsInfo.total_bitrate / 1000000).toFixed(2)} Mbps</span>
          )}
        </div>
      )}
    </div>
  );
}
