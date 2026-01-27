import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Circle } from 'lucide-react';
import { format } from 'date-fns';

interface StartRecordingDialogProps {
  channelName: string;
  onStart: (filename: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function StartRecordingDialog({ 
  channelName, 
  onStart, 
  isLoading, 
  disabled 
}: StartRecordingDialogProps) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState('');

  const generateDefaultFilename = () => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const sanitizedName = channelName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${sanitizedName}_${timestamp}`;
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setFilename(generateDefaultFilename());
    }
  };

  const handleStart = () => {
    if (filename.trim()) {
      onStart(filename.trim());
      setOpen(false);
      setFilename('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          <Circle className="h-3 w-3 fill-destructive text-destructive" />
          Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Recording</DialogTitle>
          <DialogDescription>
            Recording will capture the raw transport stream (TS) without re-encoding.
            You can rewrap to MP4 after stopping.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">.ts</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The recording will be saved as a raw TS file in the channel folder.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStart} 
            disabled={!filename.trim() || isLoading}
            className="gap-1.5"
          >
            <Circle className="h-3 w-3 fill-current" />
            Start Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
