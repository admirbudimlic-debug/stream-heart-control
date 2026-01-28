import { useState } from 'react';
import { Channel, Recording } from '@/types/streaming';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Activity, Clock, AlertCircle, Circle, HardDrive, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
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
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  activeRecording?: Recording | null;
  isLoading?: boolean;
  isRecordingLoading?: boolean;
  isEditLoading?: boolean;
}

export function ChannelCard({ 
  channel, 
  onStart, 
  onStop, 
  onDelete,
  onEdit,
  onStartRecording,
  onStopRecording,
  activeRecording,
  isLoading,
  isRecordingLoading,
  isEditLoading
}: ChannelCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [streamInfoOpen, setStreamInfoOpen] = useState(false);
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

  // Parse output/sending bitrate from last_output
  const parseOutputBitrateFromOutput = (lastOutput: string | null | undefined): number | null => {
    if (!lastOutput) return null;
    // Try SENDING pattern first
    const sendMatch = lastOutput.match(/SENDING:\s+([\d.]+)/);
    if (sendMatch) {
      const mbps = parseFloat(sendMatch[1]);
      if (!isNaN(mbps) && mbps > 0) {
        return mbps * 1000;
      }
    }
    return null;
  };

  const effectiveInputBitrate = channel.input_bitrate ?? parseBitrateFromOutput(channel.last_output);
  // For passthrough: if we have input data flowing, output should also be flowing
  const effectiveOutputBitrate = channel.output_bitrate ?? parseOutputBitrateFromOutput(channel.last_output) ?? (effectiveInputBitrate && effectiveInputBitrate > 0 ? effectiveInputBitrate : null);
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
      <div className="flex flex-col rounded-lg border bg-card">
        {/* Main Row */}
        <div className="flex items-center gap-6 p-4">
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

        {/* Stream Info Toggle */}
        <div className="flex flex-col gap-1 min-w-[100px]">
          <span className="text-[10px] uppercase text-muted-foreground">Stream Info</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStreamInfoOpen(!streamInfoOpen)}
            className="w-24 justify-between"
            disabled={!channel.ts_info}
          >
            <span className="text-xs">PIDs</span>
            {streamInfoOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          {channel.ts_info && (
            <span className="text-[10px] text-muted-foreground">
              {channel.ts_info.video?.length || 0}V / {channel.ts_info.audio?.length || 0}A
            </span>
          )}
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

        {/* Edit & Delete Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isLoading || isRunning}
            title={isRunning ? "Stop channel before editing" : "Edit channel"}
          >
            <Pencil className="h-4 w-4" />
          </Button>
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

      {/* Stream Info Panel - Collapsible */}
      {streamInfoOpen && channel.ts_info && (
        <div className="border-t px-4 py-3 bg-muted/20">
          <StreamInfoPanel 
            tsInfo={channel.ts_info} 
            isRunning={isRunning}
          />
        </div>
      )}
    </div>

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
