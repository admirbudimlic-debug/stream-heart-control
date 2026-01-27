import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticCommandsProps {
  serverName?: string;
  multicastAddress?: string;
}

interface CommandItem {
  label: string;
  command: string;
  description: string;
}

export function DiagnosticCommands({ serverName, multicastAddress }: DiagnosticCommandsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const multicastHost = multicastAddress?.split(':')[0] || '239.1.1.1';

  const commands: CommandItem[] = [
    {
      label: 'Live Agent Logs',
      command: 'sudo journalctl -u lovable-agent -f',
      description: 'Watch agent logs in real-time',
    },
    {
      label: 'Running Processes',
      command: 'ps aux | grep srt-live-transmit',
      description: 'List all SRT streaming processes',
    },
    {
      label: 'Multicast Traffic',
      command: `sudo tcpdump -i any -c 20 host ${multicastHost}`,
      description: 'Check if multicast packets are being sent',
    },
    {
      label: 'Multicast Routes',
      command: 'ip route show | grep 239',
      description: 'Verify multicast routing is configured',
    },
    {
      label: 'Add Multicast Route',
      command: 'sudo ip route add 239.0.0.0/8 dev eth0',
      description: 'Add multicast route (replace eth0 with your interface)',
    },
    {
      label: 'Network Interfaces',
      command: 'ip addr show',
      description: 'List all network interfaces',
    },
    {
      label: 'Firewall Status',
      command: 'sudo ufw status',
      description: 'Check if firewall is blocking traffic',
    },
    {
      label: 'Allow Multicast Port',
      command: 'sudo ufw allow 5000/udp',
      description: 'Open UDP port 5000 for multicast',
    },
    {
      label: 'Agent Status',
      command: 'sudo systemctl status lovable-agent',
      description: 'Check agent service status',
    },
    {
      label: 'Restart Agent',
      command: 'sudo systemctl restart lovable-agent',
      description: 'Restart the streaming agent',
    },
  ];

  const handleCopy = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Terminal className="h-4 w-4" />
          <span>SSH into your server and run these commands to debug:</span>
        </div>

        {commands.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium">{item.label}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCopy(item.command, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-3 pt-0">
              <code className="block rounded bg-muted px-2 py-1.5 font-mono text-[11px] break-all">
                {item.command}
              </code>
              <p className="mt-1.5 text-[10px] text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
