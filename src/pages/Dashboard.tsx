import { useState } from 'react';
import { useServers, useCreateServer, useDeleteServer } from '@/hooks/useServers';
import { useChannels, useCreateChannel, useDeleteChannel, useSendChannelCommand } from '@/hooks/useChannels';
import { useServerLogs } from '@/hooks/useServerLogs';
import { 
  useServerRecordings, 
  useActiveRecording, 
  useStartRecording, 
  useStopRecording, 
  useRewrapRecording,
  useDeleteRecording 
} from '@/hooks/useRecordings';
import { Header } from '@/components/dashboard/Header';
import { ServerCard } from '@/components/dashboard/ServerCard';
import { AddServerDialog } from '@/components/dashboard/AddServerDialog';
import { ChannelCard } from '@/components/dashboard/ChannelCard';
import { AddChannelDialog } from '@/components/dashboard/AddChannelDialog';
import { LogsPanel } from '@/components/dashboard/LogsPanel';
import { ProcessPanel } from '@/components/dashboard/ProcessPanel';
import { DiagnosticCommands } from '@/components/dashboard/DiagnosticCommands';
import { RecordingsPanel } from '@/components/dashboard/RecordingsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Server, Recording } from '@/types/streaming';
import { Server as ServerIcon, Radio, ScrollText, Activity, Terminal, FileVideo } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState('servers');

  // Server queries
  const { data: servers = [], isLoading: serversLoading } = useServers();
  const createServer = useCreateServer();
  const deleteServer = useDeleteServer();

  // Channel queries (filtered by selected server)
  const { data: channels = [], isLoading: channelsLoading } = useChannels(selectedServer?.id);
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();
  const sendCommand = useSendChannelCommand();

  // Logs for selected server
  const { data: logs = [], isLoading: logsLoading } = useServerLogs(selectedServer?.id);

  // Recordings for selected server
  const { data: recordings = [], isLoading: recordingsLoading } = useServerRecordings(selectedServer?.id);
  const startRecording = useStartRecording();
  const stopRecording = useStopRecording();
  const rewrapRecording = useRewrapRecording();
  const deleteRecording = useDeleteRecording();

  const handleCreateServer = async (name: string) => {
    try {
      const server = await createServer.mutateAsync(name);
      toast.success(`Server "${server.name}" created. Copy the token to configure the agent.`);
      setSelectedServer(server);
    } catch (error) {
      toast.error('Failed to create server');
    }
  };

  const handleDeleteServer = async (id: string) => {
    try {
      await deleteServer.mutateAsync(id);
      if (selectedServer?.id === id) {
        setSelectedServer(null);
        setActiveTab('servers');
      }
      toast.success('Server deleted');
    } catch (error) {
      toast.error('Failed to delete server');
    }
  };

  const handleSelectServer = (server: Server) => {
    setSelectedServer(server);
    setActiveTab('channels');
  };

  const handleCreateChannel = async (data: Parameters<typeof createChannel.mutateAsync>[0]) => {
    try {
      await createChannel.mutateAsync(data);
      toast.success('Channel created');
    } catch (error) {
      toast.error('Failed to create channel');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteChannel.mutateAsync(id);
      toast.success('Channel deleted');
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const handleStartChannel = async (channelId: string, serverId: string) => {
    try {
      await sendCommand.mutateAsync({
        serverId,
        channelId,
        commandType: 'start_channel',
      });
      toast.success('Start command sent');
    } catch (error) {
      toast.error('Failed to send start command');
    }
  };

  const handleStopChannel = async (channelId: string, serverId: string) => {
    try {
      await sendCommand.mutateAsync({
        serverId,
        channelId,
        commandType: 'stop_channel',
      });
      toast.success('Stop command sent');
    } catch (error) {
      toast.error('Failed to send stop command');
    }
  };

  const handleStartRecording = async (channelId: string, serverId: string, filename: string) => {
    try {
      await startRecording.mutateAsync({
        serverId,
        channelId,
        filename: `${filename}.ts`,
      });
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = async (channelId: string, serverId: string, recordingId: string) => {
    try {
      await stopRecording.mutateAsync({
        serverId,
        channelId,
        recordingId,
      });
      toast.success('Recording stopped');
    } catch (error) {
      toast.error('Failed to stop recording');
    }
  };

  const handleRewrapRecording = async (recording: Recording, outputFilename: string) => {
    const channel = channels.find(c => c.id === recording.channel_id);
    if (!channel) {
      toast.error('Channel not found');
      return;
    }
    
    try {
      await rewrapRecording.mutateAsync({
        serverId: channel.server_id,
        channelId: recording.channel_id,
        recordingId: recording.id,
        outputFilename: `${outputFilename}.mp4`,
      });
      toast.success('Rewrap started');
    } catch (error) {
      toast.error('Failed to start rewrap');
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      await deleteRecording.mutateAsync(id);
      toast.success('Recording deleted');
    } catch (error) {
      toast.error('Failed to delete recording');
    }
  };

  // Update selected server reference when servers list updates
  const currentSelectedServer = selectedServer 
    ? servers.find(s => s.id === selectedServer.id) ?? selectedServer
    : null;

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

  // Get active recording for each channel
  const getActiveRecording = (channelId: string): Recording | undefined => {
    return recordings.find(r => r.channel_id === channelId && r.status === 'recording');
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        {/* Tab Header */}
        <div className="border-b px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Selected server indicator */}
            <div className="flex items-center gap-3">
              {currentSelectedServer ? (
                <>
                  <Badge className={getStatusColor(currentSelectedServer.status)}>
                    {currentSelectedServer.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {channels.length} channel{channels.length !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No server selected</span>
              )}
            </div>
            
            <TabsList>
              <TabsTrigger value="servers" className="gap-1.5">
                <ServerIcon className="h-3.5 w-3.5" />
                Servers
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-1.5" disabled={!currentSelectedServer}>
                <Radio className="h-3.5 w-3.5" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="recordings" className="gap-1.5" disabled={!currentSelectedServer}>
                <FileVideo className="h-3.5 w-3.5" />
                Recordings
              </TabsTrigger>
              <TabsTrigger value="processes" className="gap-1.5" disabled={!currentSelectedServer}>
                <Activity className="h-3.5 w-3.5" />
                Processes
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5" disabled={!currentSelectedServer}>
                <ScrollText className="h-3.5 w-3.5" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="gap-1.5" disabled={!currentSelectedServer}>
                <Terminal className="h-3.5 w-3.5" />
                Diagnostics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Servers Tab */}
        <TabsContent value="servers" className="flex-1 overflow-y-auto p-6 mt-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Manage Streaming Servers
            </h3>
            <AddServerDialog onAdd={handleCreateServer} isLoading={createServer.isPending} />
          </div>

          {serversLoading ? (
            <div className="text-center text-sm text-muted-foreground">Loading servers...</div>
          ) : servers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ServerIcon className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No servers configured</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first server to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onDelete={handleDeleteServer}
                  onClick={() => handleSelectServer(server)}
                  isSelected={currentSelectedServer?.id === server.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="flex-1 overflow-y-auto p-6 mt-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              SRT to Multicast Channels
            </h3>
            {currentSelectedServer && (
              <AddChannelDialog
                serverId={currentSelectedServer.id}
                serverIndex={servers.findIndex(s => s.id === currentSelectedServer.id) + 1}
                onAdd={handleCreateChannel}
                isLoading={createChannel.isPending}
                existingChannelCount={channels.length}
              />
            )}
          </div>

          {channelsLoading ? (
            <div className="text-center text-sm text-muted-foreground">Loading channels...</div>
          ) : channels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Radio className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No channels configured</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first channel to start streaming
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels.map((channel) => {
                const activeRecording = getActiveRecording(channel.id);
                return (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    onStart={() => handleStartChannel(channel.id, channel.server_id)}
                    onStop={() => handleStopChannel(channel.id, channel.server_id)}
                    onDelete={() => handleDeleteChannel(channel.id)}
                    onStartRecording={(filename) => handleStartRecording(channel.id, channel.server_id, filename)}
                    onStopRecording={activeRecording ? () => handleStopRecording(channel.id, channel.server_id, activeRecording.id) : undefined}
                    activeRecording={activeRecording}
                    isLoading={sendCommand.isPending}
                    isRecordingLoading={startRecording.isPending || stopRecording.isPending}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="flex-1 overflow-hidden p-6 mt-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3rem)]">
              <RecordingsPanel 
                recordings={recordings}
                channels={channels}
                isLoading={recordingsLoading}
                onRewrap={handleRewrapRecording}
                onDelete={handleDeleteRecording}
                rewrapLoading={rewrapRecording.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processes Tab */}
        <TabsContent value="processes" className="flex-1 overflow-hidden p-6 mt-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Running Processes</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3rem)]">
              <ProcessPanel channels={channels} isLoading={channelsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="flex-1 overflow-hidden p-6 mt-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Server Logs</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3rem)]">
              <LogsPanel logs={logs} channels={channels} isLoading={logsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="flex-1 overflow-hidden p-6 mt-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Diagnostic Commands</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3rem)]">
              <DiagnosticCommands 
                serverName={currentSelectedServer?.name ?? ''}
                multicastAddress={channels[0]?.multicast_output}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
