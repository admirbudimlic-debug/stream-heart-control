import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CommandStatus, TsInfo } from "@/types/streaming";
import { AlertCircle, Search } from "lucide-react";

interface ChannelStreamInfoProps {
  tsInfo: TsInfo | null;
  isProbing: boolean;
  isRunning: boolean;
  probeStatus?: CommandStatus;
  probeError?: string | null;
  onProbe?: () => void;
}

export function ChannelStreamInfo({
  tsInfo,
  isProbing,
  isRunning,
  probeStatus,
  probeError,
  onProbe,
}: ChannelStreamInfoProps) {
  const hasTsInfo = !!tsInfo;
  const probeFailed = probeStatus === "failed";

  if (isProbing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 animate-pulse">
          <Search className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">Probing...</span>
        </div>
      </div>
    );
  }

  if (hasTsInfo) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] font-normal">
          {tsInfo?.video?.length || 0}V / {tsInfo?.audio?.length || 0}A
        </Badge>
        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
          {tsInfo?.service_name || "Unknown"}
        </span>
      </div>
    );
  }

  if (probeFailed) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-destructive text-destructive-foreground gap-1">
                <AlertCircle className="h-3 w-3" />
                Probe failed
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[320px] text-xs">
                {probeError ||
                  "Probe failed. Check SRT connectivity and the server agent logs."}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onProbe && (
          <Button
            variant="outline"
            size="sm"
            onClick={onProbe}
            disabled={isRunning}
            className="h-6 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
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
  );
}
