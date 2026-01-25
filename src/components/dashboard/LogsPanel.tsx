import { ServerLog } from '@/types/streaming';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LogsPanelProps {
  logs: ServerLog[];
  isLoading?: boolean;
}

export function LogsPanel({ logs, isLoading }: LogsPanelProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warn':
        return 'bg-warning text-warning-foreground';
      case 'debug':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No logs yet. Logs will appear here when the server agent connects.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex items-start gap-2 rounded px-2 py-1.5 text-sm",
              log.level === 'error' && "bg-destructive/5"
            )}
          >
            <Badge 
              className={cn("mt-0.5 shrink-0 text-[10px] font-medium", getLevelColor(log.level))}
            >
              {log.level.toUpperCase()}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="break-words font-mono text-xs">{log.message}</p>
              {log.details && (
                <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted p-1 text-[10px] text-muted-foreground">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}