import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Channel } from '@/types/streaming';
import { useEffect } from 'react';
import type { Json } from '@/integrations/supabase/types';

export function useChannels(serverId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['channels', serverId],
    queryFn: async (): Promise<Channel[]> => {
      let q = supabase
        .from('channels')
        .select('*, server:servers(*)');
      
      if (serverId) {
        q = q.eq('server_id', serverId);
      }
      
      const { data, error } = await q.order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data ?? []) as unknown as Channel[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('channels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['channels'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

interface CreateChannelInput {
  server_id: string;
  name: string;
  folder_name: string;
  srt_input: string;
  multicast_output: string;
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChannelInput): Promise<Channel> => {
      const { data, error } = await supabase
        .from('channels')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

interface UpdateChannelInput {
  id: string;
  name: string;
  folder_name: string;
  srt_input: string;
  multicast_output: string;
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateChannelInput): Promise<Channel> => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from('channels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useSendChannelCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      serverId, 
      channelId, 
      commandType, 
      payload = {} 
    }: { 
      serverId: string; 
      channelId: string; 
      commandType: string; 
      payload?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('commands')
        .insert([{
          server_id: serverId,
          channel_id: channelId,
          command_type: commandType,
          payload: payload as Json,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}