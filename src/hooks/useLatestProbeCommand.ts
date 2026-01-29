import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Command } from "@/types/streaming";

export function useLatestProbeCommand(channelId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["commands", "probe_stream", channelId],
    enabled: !!channelId,
    queryFn: async (): Promise<Command | null> => {
      if (!channelId) return null;

      const { data, error } = await supabase
        .from("commands")
        .select("*")
        .eq("channel_id", channelId)
        .eq("command_type", "probe_stream")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as unknown as Command | null;
    },
  });

  // Keep the latest probe status/error in sync via realtime updates.
  useEffect(() => {
    if (!channelId) return;

    const realtime = supabase
      .channel(`probe-stream-command-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commands",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const cmd = payload.new as Command | undefined;
          if (cmd?.command_type !== "probe_stream") return;
          queryClient.invalidateQueries({
            queryKey: ["commands", "probe_stream", channelId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtime);
    };
  }, [channelId, queryClient]);

  return query;
}
