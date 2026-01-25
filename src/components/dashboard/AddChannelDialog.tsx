import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddChannelDialogProps {
  serverId: string;
  onAdd: (data: {
    server_id: string;
    name: string;
    folder_name: string;
    srt_input: string;
    multicast_output: string;
  }) => void;
  isLoading?: boolean;
  existingMulticastCount: number;
}

export function AddChannelDialog({ serverId, onAdd, isLoading, existingMulticastCount }: AddChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [srtInput, setSrtInput] = useState('');
  const [multicastOutput, setMulticastOutput] = useState('');

  // Generate folder name from channel name
  const folderName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Auto-generate next multicast address
  useEffect(() => {
    const nextIndex = existingMulticastCount + 1;
    setMulticastOutput(`239.1.1.${nextIndex}:5000`);
  }, [existingMulticastCount, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && srtInput.trim() && multicastOutput.trim()) {
      onAdd({
        server_id: serverId,
        name: name.trim(),
        folder_name: folderName || 'channel',
        srt_input: srtInput.trim(),
        multicast_output: multicastOutput.trim(),
      });
      setName('');
      setSrtInput('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Channel</DialogTitle>
            <DialogDescription>
              Create a new SRT to Multicast channel. The stream will use srt-live-transmit for bit-perfect passthrough.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g., Sports Feed 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {folderName && (
                <p className="text-xs text-muted-foreground">
                  Folder: <code>{folderName}</code>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="srt-input">SRT Source</Label>
              <Input
                id="srt-input"
                placeholder="srt://hostname:port"
                value={srtInput}
                onChange={(e) => setSrtInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multicast-output">Multicast Output</Label>
              <Input
                id="multicast-output"
                placeholder="239.1.1.1:5000"
                value={multicastOutput}
                onChange={(e) => setMulticastOutput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !srtInput.trim() || !multicastOutput.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}