import { useState } from 'react';
import { useServers, useCreateServer, useDeleteServer } from '@/hooks/useServers';
import { useChannels, useCreateChannel, useDeleteChannel, useSendChannelCommand } from '@/hooks/useChannels';
import { useServerLogs } from '@/hooks/useServerLogs';
import { Header } from '@/components/dashboard/Header';
import { ServerCard } from '@/components/dashboard/ServerCard';
import { AddServerDialog } from '@/components/dashboard/AddServerDialog';
import { ChannelCard } from '@/components/dashboard/ChannelCard';
import { AddChannelDialog } from '@/components/dashboard/AddChannelDialog';
import { LogsPanel } from '@/components/dashboard/LogsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server } from '@/types/streaming';
import { Server as ServerIcon, Radio, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

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
      }
      toast.success('Server deleted');
    } catch (error) {
      toast.error('Failed to delete server');
    }
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

  // Update selected server reference when servers list updates
  const currentSelectedServer = selectedServer 
    ? servers.find(s => s.id === selectedServer.id) ?? selectedServer
    : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Servers */}
        <aside className="w-80 flex-shrink-0 border-r bg-card p-4 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ServerIcon className="h-4 w-4" />
              Servers
            </h2>
            <AddServerDialog onAdd={handleCreateServer} isLoading={createServer.isPending} />
          </div>

          {serversLoading ? (
            <div className="text-center text-sm text-muted-foreground">Loading servers...</div>
          ) : servers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <ServerIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No servers yet. Add your first server to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onDelete={handleDeleteServer}
                  onClick={() => setSelectedServer(server)}
                  isSelected={currentSelectedServer?.id === server.id}
                />
              ))}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {currentSelectedServer ? (
            <Tabs defaultValue="channels" className="flex h-full flex-col">
              <div className="border-b px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{currentSelectedServer.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {channels.length} channel{channels.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                  <TabsList>
                    <TabsTrigger value="channels" className="gap-1.5">
                      <Radio className="h-3.5 w-3.5" />
                      Channels
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-1.5">
                      <ScrollText className="h-3.5 w-3.5" />
                      Logs
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="channels" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    SRT to Multicast Channels
                  </h3>
                  <AddChannelDialog
                    serverId={currentSelectedServer.id}
                    onAdd={handleCreateChannel}
                    isLoading={createChannel.isPending}
                    existingMulticastCount={channels.length}
                  />
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
                    {channels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        onStart={() => handleStartChannel(channel.id, channel.server_id)}
                        onStop={() => handleStopChannel(channel.id, channel.server_id)}
                        onDelete={() => handleDeleteChannel(channel.id)}
                        isLoading={sendCommand.isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs" className="flex-1 overflow-hidden p-6 mt-0">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Server Logs</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-3rem)]">
                    <LogsPanel logs={logs} isLoading={logsLoading} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <ServerIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-medium">Select a Server</h2>
                <p className="mt-1 text-muted-foreground">
                  Choose a server from the left panel to manage its channels
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}