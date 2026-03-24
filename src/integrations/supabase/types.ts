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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_log: {
        Row: {
          completion_tokens: number | null
          cost_estimate_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_content_length: number | null
          latency_ms: number | null
          model: string
          org_id: string | null
          output_questions_count: number | null
          prompt_template: string | null
          prompt_tokens: number | null
          quiz_id: string | null
          status: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_estimate_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_content_length?: number | null
          latency_ms?: number | null
          model: string
          org_id?: string | null
          output_questions_count?: number | null
          prompt_template?: string | null
          prompt_tokens?: number | null
          quiz_id?: string | null
          status?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_estimate_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_content_length?: number | null
          latency_ms?: number | null
          model?: string
          org_id?: string | null
          output_questions_count?: number | null
          prompt_template?: string | null
          prompt_tokens?: number | null
          quiz_id?: string | null
          status?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_log_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          org_id: string | null
          preferences: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          org_id?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          bloom_taxonomy_level: string | null
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          explanation_html: string | null
          id: string
          options: Json
          order_index: number
          points: number | null
          question_html: string | null
          question_media: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          source_excerpt: string | null
          tags: string[] | null
          time_limit_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          bloom_taxonomy_level?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          explanation_html?: string | null
          id?: string
          options?: Json
          order_index?: number
          points?: number | null
          question_html?: string | null
          question_media?: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          source_excerpt?: string | null
          tags?: string[] | null
          time_limit_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          bloom_taxonomy_level?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          explanation_html?: string | null
          id?: string
          options?: Json
          order_index?: number
          points?: number | null
          question_html?: string | null
          question_media?: Json | null
          question_text?: string
          question_type?: string
          quiz_id?: string
          source_excerpt?: string | null
          tags?: string[] | null
          time_limit_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          score: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          anonymous_id: string | null
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          earned_points: number | null
          id: string
          metadata: Json | null
          quiz_id: string
          score: number | null
          score_percent: number | null
          started_at: string | null
          status: string | null
          time_spent_seconds: number | null
          total_points: number | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          id?: string
          metadata?: Json | null
          quiz_id: string
          score?: number | null
          score_percent?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          id?: string
          metadata?: Json | null
          quiz_id?: string
          score?: number | null
          score_percent?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          ai_generation_metadata: Json | null
          ai_model: string | null
          ai_prompt_version: string | null
          config: Json | null
          connection_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          expires_at: string | null
          generation_duration_ms: number | null
          id: string
          org_id: string
          published_at: string | null
          scheduled_for: string | null
          slug: string | null
          source_content_hash: string | null
          source_post_ids: number[] | null
          source_urls: string[] | null
          stats: Json | null
          status: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          ai_generation_metadata?: Json | null
          ai_model?: string | null
          ai_prompt_version?: string | null
          config?: Json | null
          connection_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at?: string | null
          generation_duration_ms?: number | null
          id?: string
          org_id: string
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string | null
          source_content_hash?: string | null
          source_post_ids?: number[] | null
          source_urls?: string[] | null
          stats?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          ai_generation_metadata?: Json | null
          ai_model?: string | null
          ai_prompt_version?: string | null
          config?: Json | null
          connection_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string | null
          generation_duration_ms?: number | null
          id?: string
          org_id?: string
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string | null
          source_content_hash?: string | null
          source_post_ids?: number[] | null
          source_urls?: string[] | null
          stats?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wp_connections: {
        Row: {
          api_base_url: string
          auth_type: string | null
          created_at: string | null
          created_by: string
          credentials_encrypted: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          org_id: string
          site_name: string
          site_url: string
          sync_metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          api_base_url: string
          auth_type?: string | null
          created_at?: string | null
          created_by: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          org_id: string
          site_name: string
          site_url: string
          sync_metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_base_url?: string
          auth_type?: string | null
          created_at?: string | null
          created_by?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          org_id?: string
          site_name?: string
          site_url?: string
          sync_metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wp_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wp_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wp_content_cache: {
        Row: {
          categories: Json | null
          connection_id: string
          content: string
          content_hash: string
          excerpt: string | null
          featured_image_url: string | null
          fetched_at: string | null
          id: string
          post_type: string | null
          slug: string | null
          tags: Json | null
          title: string
          wp_modified_at: string | null
          wp_post_id: number
          wp_published_at: string | null
        }
        Insert: {
          categories?: Json | null
          connection_id: string
          content: string
          content_hash: string
          excerpt?: string | null
          featured_image_url?: string | null
          fetched_at?: string | null
          id?: string
          post_type?: string | null
          slug?: string | null
          tags?: Json | null
          title: string
          wp_modified_at?: string | null
          wp_post_id: number
          wp_published_at?: string | null
        }
        Update: {
          categories?: Json | null
          connection_id?: string
          content?: string
          content_hash?: string
          excerpt?: string | null
          featured_image_url?: string | null
          fetched_at?: string | null
          id?: string
          post_type?: string | null
          slug?: string | null
          tags?: Json | null
          title?: string
          wp_modified_at?: string | null
          wp_post_id?: number
          wp_published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wp_content_cache_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
