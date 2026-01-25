import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServerLog } from '@/types/streaming';
import { useEffect } from 'react';

export function useServerLogs(serverId?: string, limit = 100) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['server-logs', serverId, limit],
    queryFn: async (): Promise<ServerLog[]> => {
      let q = supabase
        .from('server_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (serverId) {
        q = q.eq('server_id', serverId);
      }
      
      const { data, error } = await q;
      
      if (error) throw error;
      return data as ServerLog[];
    },
  });

  // Set up realtime subscription for new logs
  useEffect(() => {
    const channel = supabase
      .channel('server-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'server_logs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['server-logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}