import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Channel } from '@/types/streaming';

interface EditChannelDialogProps {
  channel: Channel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: string;
    name: string;
    folder_name: string;
    srt_input: string;
    multicast_output: string;
  }) => void;
  isLoading?: boolean;
}

// Parse SRT URL to extract base URL and parameters
function parseSrtUrl(url: string) {
  const questionIndex = url.indexOf('?');
  if (questionIndex === -1) {
    return { baseUrl: url, params: {} };
  }
  const baseUrl = url.substring(0, questionIndex);
  const paramString = url.substring(questionIndex + 1);
  const params: Record<string, string> = {};
  paramString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return { baseUrl, params };
}

export function EditChannelDialog({ channel, open, onOpenChange, onSave, isLoading }: EditChannelDialogProps) {
  const [name, setName] = useState('');
  const [srtInput, setSrtInput] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [multicastOutput, setMulticastOutput] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Advanced SRT parameters
  const [srtMode, setSrtMode] = useState('caller');
  const [latency, setLatency] = useState('');
  const [peerIdleTimeout, setPeerIdleTimeout] = useState('');
  const [rcvBuf, setRcvBuf] = useState('');
  const [sndBuf, setSndBuf] = useState('');
  const [fc, setFc] = useState('');

  // Initialize form when channel changes
  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setMulticastOutput(channel.multicast_output);
      
      // Parse existing SRT URL
      const { baseUrl, params } = parseSrtUrl(channel.srt_input);
      setSrtInput(baseUrl);
      
      // Extract known parameters
      setPassphrase(params.passphrase || '');
      setSrtMode(params.mode || 'caller');
      setLatency(params.latency || params.rcvlatency || '');
      setPeerIdleTimeout(params.peeridletimeout || '');
      setRcvBuf(params.rcvbuf || '');
      setSndBuf(params.sndbuf || '');
      setFc(params.fc || '');
      
      // Open advanced section if any advanced params are set
      if (params.latency || params.peeridletimeout || params.rcvbuf || params.sndbuf || params.fc || params.mode) {
        setAdvancedOpen(true);
      }
    }
  }, [channel]);

  // Generate folder name from channel name
  const folderName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Build the full SRT URL with all parameters
  const buildSrtUrl = (): string => {
    const params: string[] = [];
    
    if (passphrase.trim()) {
      params.push(`passphrase=${encodeURIComponent(passphrase.trim())}`);
    }
    if (srtMode && srtMode !== 'caller') {
      params.push(`mode=${srtMode}`);
    }
    if (latency.trim()) {
      params.push(`latency=${latency.trim()}`);
      params.push(`rcvlatency=${latency.trim()}`);
    }
    if (peerIdleTimeout.trim()) {
      params.push(`peeridletimeout=${peerIdleTimeout.trim()}`);
    }
    if (rcvBuf.trim()) {
      params.push(`rcvbuf=${rcvBuf.trim()}`);
    }
    if (sndBuf.trim()) {
      params.push(`sndbuf=${sndBuf.trim()}`);
    }
    if (fc.trim()) {
      params.push(`fc=${fc.trim()}`);
    }
    
    if (params.length === 0) return srtInput.trim();
    
    const separator = srtInput.includes('?') ? '&' : '?';
    return `${srtInput.trim()}${separator}${params.join('&')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channel && name.trim() && srtInput.trim() && multicastOutput.trim()) {
      onSave({
        id: channel.id,
        name: name.trim(),
        folder_name: folderName || 'channel',
        srt_input: buildSrtUrl(),
        multicast_output: multicastOutput.trim(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription>
              Modify channel settings and SRT parameters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-channel-name">Channel Name</Label>
              <Input
                id="edit-channel-name"
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
              <Label htmlFor="edit-srt-input">SRT Source</Label>
              <Input
                id="edit-srt-input"
                placeholder="srt://hostname:port"
                value={srtInput}
                onChange={(e) => setSrtInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Base URL without parameters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-passphrase">Passphrase (Optional)</Label>
              <Input
                id="edit-passphrase"
                type="password"
                placeholder="SRT encryption passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-multicast-output">Multicast Output</Label>
              <Input
                id="edit-multicast-output"
                placeholder="239.1.1.1:5000"
                value={multicastOutput}
                onChange={(e) => setMulticastOutput(e.target.value)}
              />
            </div>

            {/* Advanced SRT Parameters */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Advanced SRT Parameters
                  <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-srt-mode">SRT Mode</Label>
                  <Select value={srtMode} onValueChange={setSrtMode}>
                    <SelectTrigger id="edit-srt-mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caller">Caller (default)</SelectItem>
                      <SelectItem value="listener">Listener</SelectItem>
                      <SelectItem value="rendezvous">Rendezvous</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Connection mode - must match sender configuration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-latency">Latency (ms)</Label>
                  <Input
                    id="edit-latency"
                    type="number"
                    placeholder="120 (default)"
                    value={latency}
                    onChange={(e) => setLatency(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = less delay, higher = more buffer for packet recovery
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-peeridletimeout">Peer Idle Timeout (ms)</Label>
                  <Input
                    id="edit-peeridletimeout"
                    type="number"
                    placeholder="300000 (5 minutes)"
                    value={peerIdleTimeout}
                    onChange={(e) => setPeerIdleTimeout(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Increase to prevent drops on idle connections
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rcvbuf">Receive Buffer</Label>
                    <Input
                      id="edit-rcvbuf"
                      type="number"
                      placeholder="12058624"
                      value={rcvBuf}
                      onChange={(e) => setRcvBuf(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sndbuf">Send Buffer</Label>
                    <Input
                      id="edit-sndbuf"
                      type="number"
                      placeholder="12058624"
                      value={sndBuf}
                      onChange={(e) => setSndBuf(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buffer sizes in bytes. Increase for high-bitrate streams.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="edit-fc">Flow Control Window</Label>
                  <Input
                    id="edit-fc"
                    type="number"
                    placeholder="25600"
                    value={fc}
                    onChange={(e) => setFc(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max packets in flight. Increase for high-latency links.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !srtInput.trim() || !multicastOutput.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
