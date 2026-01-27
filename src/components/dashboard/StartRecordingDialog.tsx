import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';

interface StartRecordingButtonProps {
  channelName: string;
  onStart: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function StartRecordingButton({ 
  onStart, 
  isLoading, 
  disabled 
}: StartRecordingButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || isLoading}
      onClick={onStart}
      className="gap-1.5"
    >
      <Circle className="h-3 w-3 fill-destructive text-destructive" />
      Record
    </Button>
  );
}
