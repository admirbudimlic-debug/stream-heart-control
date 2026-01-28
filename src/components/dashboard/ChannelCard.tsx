import { useState } from 'react';
import { Channel, Recording } from '@/types/streaming';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Activity, AlertCircle, Pencil } from 'lucide-react';
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
      <div className="flex flex-col rounded-lg border bg-card">
        {/* Header Row: Channel name, SRT input, status, actions */}
        <div className="flex items-center gap-4 p-4 border-b">
          {/* Name & Status */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-lg">{channel.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{channel.folder_name}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* SRT Input */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] uppercase text-muted-foreground">SRT Input</span>
            <code className={cn(
              "text-xs rounded px-2 py-1",
              isRunning && hasInputData ? "bg-success/20 text-success" : 
              isRunning && !hasInputData ? "bg-warning/20 text-warning" : "bg-muted"
            )}>
              {channel.srt_input.replace(/\?.*/, '')}
            </code>
          </div>

          {/* Multicast Output */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-[10px] uppercase text-muted-foreground">Multicast Output</span>
            <code className="text-xs rounded px-2 py-1 bg-muted">
              {channel.multicast_output}
            </code>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title="Input Bitrate">
              <Activity className="h-3.5 w-3.5" />
              <span className="font-mono">{formatBitrate(effectiveInputBitrate)}</span>
            </div>
            <div className="flex items-center gap-1" title="Dropped Packets">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-mono">{channel.dropped_packets ?? 0}</span>
            </div>
          </div>

          {/* Actions */}
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

        {/* Stream Info Panel - Always visible */}
        <div className="p-4">
          <StreamInfoPanel 
            tsInfo={channel.ts_info} 
            isRunning={isRunning}
            isRecording={isRecording}
            onStartMulticast={() => onStart()}
            onStopMulticast={() => onStop()}
            onStartRecording={() => onStartRecording?.()}
            onStopRecording={() => onStopRecording?.()}
            isMulticastLoading={isLoading}
            isRecordingLoading={isRecordingLoading}
          />
        </div>
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
