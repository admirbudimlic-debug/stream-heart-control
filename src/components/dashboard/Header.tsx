import { Radio } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Radio className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Stream Control</h1>
            <p className="text-xs text-muted-foreground">Video Streaming Management System</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}