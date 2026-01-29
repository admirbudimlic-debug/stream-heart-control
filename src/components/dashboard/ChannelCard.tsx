import { useState } from 'react';
import { Channel, Recording } from '@/types/streaming';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Activity, AlertCircle, Pencil, Search, Play, Square, Circle, HardDrive, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditChannelDialog } from './EditChannelDialog';
import { StreamInfoPanel } from './StreamInfoPanel';

interface ChannelCardProps {
  channel: Channel;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onEdit: (data: {
    id: string;
    name: string;
    folder_name: string;
    srt_input: string;
    multicast_output: string;
  }) => void;
  onProbe?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  activeRecording?: Recording | null;
  isLoading?: boolean;
  isProbing?: boolean;
  isRecordingLoading?: boolean;
  isEditLoading?: boolean;
}

export function ChannelCard({ 
  channel, 
  onStart, 
  onStop, 
  onDelete,
  onEdit,
  onProbe,
  onStartRecording,
  onStopRecording,
  activeRecording,
  isLoading,
  isProbing,
  isRecordingLoading,
  isEditLoading
}: ChannelCardProps) {
  const [editOpen, setEditOpen] = useState(false);

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
  const hasInputData = effectiveInputBitrate !== null && effectiveInputBitrate > 0;
  const isTransitioning = channel.status === 'starting' || channel.status === 'stopping';
  const isRecording = !!activeRecording;
  const hasTsInfo = !!channel.ts_info;

  const getStatusBadge = () => {
    if (isRunning && hasInputData) {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          LIVE
        </Badge>
      );
    }
    if (isRunning && !hasInputData) {
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

  const handleEditSave = (data: {
    id: string;
    name: string;
    folder_name: string;
    srt_input: string;
    multicast_output: string;
  }) => {
    onEdit(data);
    setEditOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
        {/* Name & Status */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="font-medium text-sm">{channel.name}</span>
          {getStatusBadge()}
        </div>

        {/* SRT Input */}
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          <span className="text-[10px] uppercase text-muted-foreground">SRT Input</span>
          <code className={cn(
            "text-xs truncate max-w-[200px] rounded px-1.5 py-0.5",
            isRunning && hasInputData ? "bg-success/20 text-success" : 
            isRunning && !hasInputData ? "bg-warning/20 text-warning" : "bg-muted"
          )}>
            {channel.srt_input.replace(/\?.*/, '')}
          </code>
        </div>

        {/* Probe / TS Info Summary */}
        <div className="flex flex-col gap-0.5 min-w-[140px]">
          <span className="text-[10px] uppercase text-muted-foreground">Stream Info</span>
          {isProbing ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 animate-pulse">
                <Search className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Probing...</span>
              </div>
            </div>
          ) : hasTsInfo ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-normal">
                {channel.ts_info?.video?.length || 0}V / {channel.ts_info?.audio?.length || 0}A
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {channel.ts_info?.service_name || 'Unknown'}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onProbe}
              disabled={isRunning}
              className="h-6 text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              Probe
            </Button>
          )}
        </div>

        {/* Multicast Output */}
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <span className="text-[10px] uppercase text-muted-foreground">Multicast</span>
          <code className={cn(
            "text-xs rounded px-1.5 py-0.5",
            isRunning ? "bg-success/20 text-success" : "bg-muted"
          )}>
            {channel.multicast_output}
          </code>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-[120px]">
          <div className="flex items-center gap-1" title="Bitrate">
            <Activity className="h-3 w-3" />
            <span className="font-mono">{formatBitrate(effectiveInputBitrate)}</span>
          </div>
          <div className="flex items-center gap-1" title="Uptime">
            <Clock className="h-3 w-3" />
            <span className="font-mono">{formatUptime(channel.uptime_seconds)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Start/Stop Multicast */}
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              disabled={isLoading || isTransitioning}
              className="h-7"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onStart}
              disabled={isLoading || isTransitioning || isProbing}
              title={!hasTsInfo ? "Start multicast (full stream passthrough)" : "Start multicast"}
              className="h-7"
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}

          {/* Record Button */}
          {isRecording ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopRecording}
              disabled={isRecordingLoading}
              className="h-7"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop Rec
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartRecording}
              disabled={isRecordingLoading || !isRunning}
              className="h-7"
            >
              <Circle className="h-3 w-3 fill-destructive text-destructive mr-1" />
              Rec
            </Button>
          )}

          {/* Recording Size */}
          {isRecording && activeRecording?.file_size_bytes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              {(activeRecording.file_size_bytes / (1024 * 1024)).toFixed(1)}MB
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Edit & Delete */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isLoading || isRunning}
            title={isRunning ? "Stop channel before editing" : "Edit channel"}
            className="h-7 w-7 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            disabled={isLoading || isRecording}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expandable Stream Info Panel - only when ts_info exists */}
      {hasTsInfo && (
        <div className="ml-4 mr-4 -mt-px">
          <StreamInfoPanel 
            tsInfo={channel.ts_info} 
            isRunning={isRunning}
            isRecording={isRecording}
          />
        </div>
      )}

      <EditChannelDialog
        channel={editOpen ? channel : null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleEditSave}
        isLoading={isEditLoading}
      />
    </>
  );
}
