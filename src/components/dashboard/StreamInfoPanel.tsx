import { useState, useEffect } from 'react';
import { TsInfo } from '@/types/streaming';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamInfoPanelProps {
  tsInfo: TsInfo | null;
  isRunning: boolean;
  isRecording: boolean;
}

export function StreamInfoPanel({ 
  tsInfo, 
  isRunning,
  isRecording
}: StreamInfoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [pidSelections, setPidSelections] = useState<Record<number, { mc: boolean; rec: boolean; xc: boolean }>>({});

  // Initialize selections when tsInfo changes
  useEffect(() => {
    if (!tsInfo) return;
    
    const allPids = [
      ...(tsInfo.video?.map(v => v.pid) || []),
      ...(tsInfo.audio?.map(a => a.pid) || [])
    ];
    
    const initial: Record<number, { mc: boolean; rec: boolean; xc: boolean }> = {};
    allPids.forEach(pid => {
      initial[pid] = { mc: true, rec: true, xc: false };
    });
    setPidSelections(initial);
  }, [tsInfo]);

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

  if (!tsInfo) return null;

  const hasStreams = (tsInfo.video?.length || 0) > 0 || (tsInfo.audio?.length || 0) > 0;
  if (!hasStreams) return null;

  return (
    <div className="rounded-b-lg border border-t-0 bg-muted/20 text-xs">
      {/* Collapsed Summary / Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Service:</span>
          <span className="font-medium">{tsInfo.service_name || 'N/A'}</span>
          {tsInfo.provider && (
            <>
              <span className="text-muted-foreground">Provider:</span>
              <span>{tsInfo.provider}</span>
            </>
          )}
          <span className="text-muted-foreground">PMT:</span>
          <span className="font-mono">{tsInfo.pmt_pid || 'N/A'}</span>
          <span className="text-muted-foreground">PCR:</span>
          <span className="font-mono">{tsInfo.pcr_pid || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {tsInfo.video?.length || 0} video, {tsInfo.audio?.length || 0} audio
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded PID Table */}
      {expanded && (
        <div className="border-t px-3 py-2">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase text-muted-foreground">
                <th className="text-left py-1 font-medium w-20">Type</th>
                <th className="text-left py-1 font-medium w-32">PID</th>
                <th className="text-left py-1 font-medium">Details</th>
                <th className="text-center py-1 font-medium w-16">MC</th>
                <th className="text-center py-1 font-medium w-16">REC</th>
                <th className="text-center py-1 font-medium w-16">XC</th>
              </tr>
            </thead>
            <tbody>
              {/* Video Streams */}
              {tsInfo.video?.map((v, idx) => {
                const sel = getSelection(v.pid);
                return (
                  <tr key={`video-${v.pid}-${idx}`} className="border-t border-border/30">
                    <td className="py-1.5">
                      <Badge variant="secondary" className="text-[10px]">Video</Badge>
                    </td>
                    <td className="py-1.5 font-mono">{formatPid(v.pid)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {v.codec}{v.resolution && ` • ${v.resolution}`}{v.bitrate && ` • ${(v.bitrate / 1000).toFixed(0)}kb/s`}
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.mc}
                        onCheckedChange={() => toggleSelection(v.pid, 'mc')}
                        disabled={isRunning}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.rec}
                        onCheckedChange={() => toggleSelection(v.pid, 'rec')}
                        disabled={isRecording}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.xc}
                        onCheckedChange={() => toggleSelection(v.pid, 'xc')}
                        disabled
                        className="h-4 w-4"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Audio Streams */}
              {tsInfo.audio?.map((a, idx) => {
                const sel = getSelection(a.pid);
                return (
                  <tr key={`audio-${a.pid}-${idx}`} className="border-t border-border/30">
                    <td className="py-1.5">
                      <Badge variant="outline" className="text-[10px]">Audio {idx + 1}</Badge>
                    </td>
                    <td className="py-1.5 font-mono">{formatPid(a.pid)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {a.codec}{a.language && ` • ${a.language}`}{a.bitrate && ` • ${a.bitrate}kb/s`}
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.mc}
                        onCheckedChange={() => toggleSelection(a.pid, 'mc')}
                        disabled={isRunning}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.rec}
                        onCheckedChange={() => toggleSelection(a.pid, 'rec')}
                        disabled={isRecording}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <Checkbox
                        checked={sel.xc}
                        onCheckedChange={() => toggleSelection(a.pid, 'xc')}
                        disabled
                        className="h-4 w-4"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bitrate footer */}
          {tsInfo.total_bitrate && (
            <div className="mt-2 pt-2 border-t border-border/30 text-muted-foreground">
              Total Bitrate: {(tsInfo.total_bitrate / 1000000).toFixed(2)} Mbps
            </div>
          )}
        </div>
      )}
    </div>
  );
}
