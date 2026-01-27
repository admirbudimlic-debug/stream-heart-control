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
import { FileVideo } from 'lucide-react';
import { Recording } from '@/types/streaming';

interface RewrapDialogProps {
  recording: Recording;
  onRewrap: (outputFilename: string) => void;
  isLoading?: boolean;
}

export function RewrapDialog({ recording, onRewrap, isLoading }: RewrapDialogProps) {
  const [open, setOpen] = useState(false);
  const [outputFilename, setOutputFilename] = useState('');

  const generateDefaultFilename = () => {
    // Remove .ts extension and use same base name
    return recording.filename.replace(/\.ts$/i, '');
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setOutputFilename(generateDefaultFilename());
    }
  };

  const handleRewrap = () => {
    if (outputFilename.trim()) {
      onRewrap(outputFilename.trim());
      setOpen(false);
      setOutputFilename('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={recording.status === 'processing' || recording.status === 'recording'}
          className="gap-1.5"
        >
          <FileVideo className="h-3 w-3" />
          Rewrap MP4
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rewrap to MP4</DialogTitle>
          <DialogDescription>
            This will remux the TS file to MP4 without re-encoding. 
            The original TS file will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <code className="text-xs">{recording.filename}</code>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="output-filename">Output Filename</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="output-filename"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                placeholder="Enter output filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">.mp4</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRewrap} 
            disabled={!outputFilename.trim() || isLoading}
            className="gap-1.5"
          >
            <FileVideo className="h-3 w-3" />
            Rewrap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
