import { Server } from '@/types/streaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, MemoryStick, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  server: Server;
  onDelete: (id: string) => void;
  onClick: () => void;
  isSelected?: boolean;
}

export function ServerCard({ server, onDelete, onClick, isSelected }: ServerCardProps) {
  const [copied, setCopied] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-success text-success-foreground';
      case 'connecting':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const copyToken = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(server.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(server.id);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{server.name}</CardTitle>
          <Badge className={getStatusColor(server.status)}>
            {server.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resource Usage */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                CPU
              </span>
              <span>{server.cpu_usage?.toFixed(1) ?? '--'}%</span>
            </div>
            <Progress value={server.cpu_usage ?? 0} className="h-1.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MemoryStick className="h-3.5 w-3.5" />
                Memory
              </span>
              <span>{server.memory_usage?.toFixed(1) ?? '--'}%</span>
            </div>
            <Progress value={server.memory_usage ?? 0} className="h-1.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                Disk
              </span>
              <span>
                {server.disk_used_gb?.toFixed(1) ?? '--'} / {server.disk_total_gb?.toFixed(0) ?? '--'} GB
              </span>
            </div>
            <Progress value={server.disk_usage ?? 0} className="h-1.5" />
          </div>
        </div>

        {/* Token */}
        <div className="flex items-center gap-2 rounded-md bg-muted p-2">
          <code className="flex-1 truncate text-xs text-muted-foreground">
            {server.token.slice(0, 16)}...
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={copyToken}
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}