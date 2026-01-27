import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Recording } from '@/types/streaming';
import { useEffect } from 'react';
import type { Json } from '@/integrations/supabase/types';

export function useRecordings(channelId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recordings', channelId],
    queryFn: async (): Promise<Recording[]> => {
      let q = supabase
        .from('recordings')
        .select('*, channel:channels(*)');
      
      if (channelId) {
        q = q.eq('channel_id', channelId);
      }
      
      const { data, error } = await q.order('started_at', { ascending: false });
      
      if (error) throw error;
      return (data ?? []) as unknown as Recording[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('recordings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recordings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recordings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useServerRecordings(serverId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recordings', 'server', serverId],
    queryFn: async (): Promise<Recording[]> => {
      if (!serverId) return [];
      
      // Get all channels for this server first
      const { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('server_id', serverId);
      
      if (!channels || channels.length === 0) return [];
      
      const channelIds = channels.map(c => c.id);
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*, channel:channels(*)')
        .in('channel_id', channelIds)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return (data ?? []) as unknown as Recording[];
    },
    enabled: !!serverId,
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('recordings-server-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recordings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recordings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useActiveRecording(channelId?: string) {
  return useQuery({
    queryKey: ['recordings', 'active', channelId],
    queryFn: async (): Promise<Recording | null> => {
      if (!channelId) return null;
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('status', 'recording')
        .maybeSingle();
      
      if (error) throw error;
      return data as Recording | null;
    },
    enabled: !!channelId,
    refetchInterval: 5000, // Poll every 5 seconds for active recordings
  });
}

export function useStartRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      serverId, 
      channelId, 
      filename 
    }: { 
      serverId: string; 
      channelId: string; 
      filename: string;
    }) => {
      // Send command to start recording
      const { data, error } = await supabase
        .from('commands')
        .insert([{
          server_id: serverId,
          channel_id: channelId,
          command_type: 'start_recording',
          payload: { filename } as unknown as Json,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useStopRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      serverId, 
      channelId, 
      recordingId 
    }: { 
      serverId: string; 
      channelId: string; 
      recordingId: string;
    }) => {
      const { data, error } = await supabase
        .from('commands')
        .insert([{
          server_id: serverId,
          channel_id: channelId,
          command_type: 'stop_recording',
          payload: { recording_id: recordingId } as unknown as Json,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useRewrapRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      serverId, 
      channelId, 
      recordingId,
      outputFilename
    }: { 
      serverId: string; 
      channelId: string; 
      recordingId: string;
      outputFilename: string;
    }) => {
      const { data, error } = await supabase
        .from('commands')
        .insert([{
          server_id: serverId,
          channel_id: channelId,
          command_type: 'rewrap_recording',
          payload: { 
            recording_id: recordingId,
            output_filename: outputFilename 
          } as unknown as Json,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
}
