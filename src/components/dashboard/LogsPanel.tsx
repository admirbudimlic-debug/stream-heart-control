import { useState, useMemo } from 'react';
import { ServerLog } from '@/types/streaming';
import { Channel } from '@/types/streaming';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, X, Filter } from 'lucide-react';

interface LogsPanelProps {
  logs: ServerLog[];
  channels?: Channel[];
  isLoading?: boolean;
}

export function LogsPanel({ logs, channels = [], isLoading }: LogsPanelProps) {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warn':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'debug':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }
      // Channel filter
      if (channelFilter !== 'all' && log.channel_id !== channelFilter) {
        return false;
      }
      // Search filter
      if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [logs, levelFilter, channelFilter, searchText]);

  const hasFilters = levelFilter !== 'all' || channelFilter !== 'all' || searchText !== '';

  const clearFilters = () => {
    setLevelFilter('all');
    setChannelFilter('all');
    setSearchText('');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading logs...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warn</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {channels.map(ch => (
              <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}

        <span className="text-xs text-muted-foreground">
          {filteredLogs.length} of {logs.length}
        </span>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No logs yet. Logs will appear here when the server agent connects.
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No logs match your filters.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredLogs.map((log) => (
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
      )}
    </div>
  );
}
