export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string
          dropped_packets: number | null
          error_message: string | null
          folder_name: string
          id: string
          input_bitrate: number | null
          last_output: string | null
          last_output_at: string | null
          multicast_output: string
          name: string
          output_bitrate: number | null
          pid: number | null
          server_id: string
          srt_input: string
          status: Database["public"]["Enums"]["channel_status"]
          ts_analyzed_at: string | null
          ts_info: Json | null
          updated_at: string
          uptime_seconds: number | null
        }
        Insert: {
          created_at?: string
          dropped_packets?: number | null
          error_message?: string | null
          folder_name: string
          id?: string
          input_bitrate?: number | null
          last_output?: string | null
          last_output_at?: string | null
          multicast_output: string
          name: string
          output_bitrate?: number | null
          pid?: number | null
          server_id: string
          srt_input: string
          status?: Database["public"]["Enums"]["channel_status"]
          ts_analyzed_at?: string | null
          ts_info?: Json | null
          updated_at?: string
          uptime_seconds?: number | null
        }
        Update: {
          created_at?: string
          dropped_packets?: number | null
          error_message?: string | null
          folder_name?: string
          id?: string
          input_bitrate?: number | null
          last_output?: string | null
          last_output_at?: string | null
          multicast_output?: string
          name?: string
          output_bitrate?: number | null
          pid?: number | null
          server_id?: string
          srt_input?: string
          status?: Database["public"]["Enums"]["channel_status"]
          ts_analyzed_at?: string | null
          ts_info?: Json | null
          updated_at?: string
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      commands: {
        Row: {
          channel_id: string | null
          command_type: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          result: Json | null
          server_id: string
          status: Database["public"]["Enums"]["command_status"]
        }
        Insert: {
          channel_id?: string | null
          command_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          result?: Json | null
          server_id: string
          status?: Database["public"]["Enums"]["command_status"]
        }
        Update: {
          channel_id?: string | null
          command_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          result?: Json | null
          server_id?: string
          status?: Database["public"]["Enums"]["command_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commands_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commands_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          channel_id: string
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          file_size_bytes: number | null
          filename: string
          filepath: string
          id: string
          mp4_filepath: string | null
          started_at: string
          status: Database["public"]["Enums"]["recording_status"]
          stopped_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          filename: string
          filepath: string
          id?: string
          mp4_filepath?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["recording_status"]
          stopped_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          filename?: string
          filepath?: string
          id?: string
          mp4_filepath?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["recording_status"]
          stopped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      server_logs: {
        Row: {
          channel_id: string | null
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
          server_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message: string
          server_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          base_path: string | null
          cpu_usage: number | null
          created_at: string
          disk_total_gb: number | null
          disk_usage: number | null
          disk_used_gb: number | null
          id: string
          last_seen_at: string | null
          memory_usage: number | null
          name: string
          status: Database["public"]["Enums"]["server_status"]
          token: string
          updated_at: string
        }
        Insert: {
          base_path?: string | null
          cpu_usage?: number | null
          created_at?: string
          disk_total_gb?: number | null
          disk_usage?: number | null
          disk_used_gb?: number | null
          id?: string
          last_seen_at?: string | null
          memory_usage?: number | null
          name: string
          status?: Database["public"]["Enums"]["server_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          base_path?: string | null
          cpu_usage?: number | null
          created_at?: string
          disk_total_gb?: number | null
          disk_usage?: number | null
          disk_used_gb?: number | null
          id?: string
          last_seen_at?: string | null
          memory_usage?: number | null
          name?: string
          status?: Database["public"]["Enums"]["server_status"]
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_status: "running" | "stopped" | "error" | "starting" | "stopping"
      command_status: "pending" | "processing" | "completed" | "failed"
      recording_status:
        | "recording"
        | "stopped"
        | "processing"
        | "completed"
        | "error"
      server_status: "online" | "offline" | "connecting"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      channel_status: ["running", "stopped", "error", "starting", "stopping"],
      command_status: ["pending", "processing", "completed", "failed"],
      recording_status: [
        "recording",
        "stopped",
        "processing",
        "completed",
        "error",
      ],
      server_status: ["online", "offline", "connecting"],
    },
  },
} as const
