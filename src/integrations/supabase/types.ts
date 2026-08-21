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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      connect_cast: {
        Row: {
          billing: number | null
          cast_order: number | null
          character_name: string | null
          movie_id: string
          person_id: string
          source: string
          tmdb_credit_id: string | null
        }
        Insert: {
          billing?: number | null
          cast_order?: number | null
          character_name?: string | null
          movie_id: string
          person_id: string
          source?: string
          tmdb_credit_id?: string | null
        }
        Update: {
          billing?: number | null
          cast_order?: number | null
          character_name?: string | null
          movie_id?: string
          person_id?: string
          source?: string
          tmdb_credit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connect_cast_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "connect_movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_cast_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "connect_people"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_ingest_items: {
        Row: {
          attempts: number
          item_id: string
          last_error: string | null
          run_id: string
          stage: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          item_id: string
          last_error?: string | null
          run_id: string
          stage: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          item_id?: string
          last_error?: string | null
          run_id?: string
          stage?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_ingest_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_ingest_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_status"
            referencedColumns: ["run_id"]
          },
        ]
      }
      connect_ingest_runs: {
        Row: {
          created_at: string
          id: string
          label: string
          last_error: string | null
          source: string
          stage: string
          stats: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          last_error?: string | null
          source?: string
          stage?: string
          stats?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_error?: string | null
          source?: string
          stage?: string
          stats?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      connect_movies: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          notability: number
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          source: string
          title: string
          tmdb_id: number | null
          year: number
        }
        Insert: {
          created_at?: string
          id: string
          last_synced_at?: string | null
          notability?: number
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          source?: string
          title: string
          tmdb_id?: number | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          notability?: number
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          source?: string
          title?: string
          tmdb_id?: number | null
          year?: number
        }
        Relationships: []
      }
      connect_people: {
        Row: {
          birth_year: number | null
          challenge_eligible: boolean
          coverage_status: string
          created_at: string
          credit_count: number
          hydrated_at: string | null
          id: string
          image_attribution_url: string | null
          image_file: string | null
          image_source: string
          last_synced_at: string | null
          name: string
          notability: number
          popularity: number | null
          profile_path: string | null
          source: string
          tmdb_id: number | null
        }
        Insert: {
          birth_year?: number | null
          challenge_eligible?: boolean
          coverage_status?: string
          created_at?: string
          credit_count?: number
          hydrated_at?: string | null
          id: string
          image_attribution_url?: string | null
          image_file?: string | null
          image_source?: string
          last_synced_at?: string | null
          name: string
          notability?: number
          popularity?: number | null
          profile_path?: string | null
          source?: string
          tmdb_id?: number | null
        }
        Update: {
          birth_year?: number | null
          challenge_eligible?: boolean
          coverage_status?: string
          created_at?: string
          credit_count?: number
          hydrated_at?: string | null
          id?: string
          image_attribution_url?: string | null
          image_file?: string | null
          image_source?: string
          last_synced_at?: string | null
          name?: string
          notability?: number
          popularity?: number | null
          profile_path?: string | null
          source?: string
          tmdb_id?: number | null
        }
        Relationships: []
      }
      connect_reports: {
        Row: {
          context: Json
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          message: string
          movie_id: string | null
          person_id: string | null
          resolved_movie_id: string | null
          resolved_person_id: string | null
          status: string
          visitor_key: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          message: string
          movie_id?: string | null
          person_id?: string | null
          resolved_movie_id?: string | null
          resolved_person_id?: string | null
          status?: string
          visitor_key?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          message?: string
          movie_id?: string | null
          person_id?: string | null
          resolved_movie_id?: string | null
          resolved_person_id?: string | null
          status?: string
          visitor_key?: string | null
        }
        Relationships: []
      }
      connect_stage_cast: {
        Row: {
          billing: number | null
          character_qid: string | null
          movie_id: string
          person_id: string
          run_id: string
        }
        Insert: {
          billing?: number | null
          character_qid?: string | null
          movie_id: string
          person_id: string
          run_id: string
        }
        Update: {
          billing?: number | null
          character_qid?: string | null
          movie_id?: string
          person_id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_stage_cast_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_stage_cast_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_status"
            referencedColumns: ["run_id"]
          },
        ]
      }
      connect_stage_characters: {
        Row: {
          id: string
          label: string
          run_id: string
        }
        Insert: {
          id: string
          label: string
          run_id: string
        }
        Update: {
          id?: string
          label?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_stage_characters_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_stage_characters_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_status"
            referencedColumns: ["run_id"]
          },
        ]
      }
      connect_stage_movies: {
        Row: {
          id: string
          run_id: string
          sitelinks: number
          title: string
          year: number
        }
        Insert: {
          id: string
          run_id: string
          sitelinks?: number
          title: string
          year: number
        }
        Update: {
          id?: string
          run_id?: string
          sitelinks?: number
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "connect_stage_movies_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_stage_movies_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_status"
            referencedColumns: ["run_id"]
          },
        ]
      }
      connect_stage_people: {
        Row: {
          birth_year: number | null
          id: string
          image_file: string | null
          name: string
          run_id: string
          sitelinks: number
        }
        Insert: {
          birth_year?: number | null
          id: string
          image_file?: string | null
          name: string
          run_id: string
          sitelinks?: number
        }
        Update: {
          birth_year?: number | null
          id?: string
          image_file?: string | null
          name?: string
          run_id?: string
          sitelinks?: number
        }
        Relationships: [
          {
            foreignKeyName: "connect_stage_people_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_stage_people_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "connect_ingest_status"
            referencedColumns: ["run_id"]
          },
        ]
      }
      connect_sync_items: {
        Row: {
          attempts: number
          job_id: string
          kind: string
          last_error: string | null
          payload: Json
          ref_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          job_id: string
          kind: string
          last_error?: string | null
          payload?: Json
          ref_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          job_id?: string
          kind?: string
          last_error?: string | null
          payload?: Json
          ref_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_sync_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "connect_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_sync_jobs: {
        Row: {
          created_at: string
          done_items: number
          failed_items: number
          id: string
          label: string
          last_error: string | null
          source: string
          stage: string
          stats: Json
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_items?: number
          failed_items?: number
          id?: string
          label?: string
          last_error?: string | null
          source?: string
          stage?: string
          stats?: Json
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_items?: number
          failed_items?: number
          id?: string
          label?: string
          last_error?: string | null
          source?: string
          stage?: string
          stats?: Json
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_connect: {
        Row: {
          created_at: string
          date: string
          number: number
          optimal_clicks: number
          published: boolean
          start_person_id: string
          target_person_id: string
        }
        Insert: {
          created_at?: string
          date: string
          number: number
          optimal_clicks: number
          published?: boolean
          start_person_id: string
          target_person_id: string
        }
        Update: {
          created_at?: string
          date?: string
          number?: number
          optimal_clicks?: number
          published?: boolean
          start_person_id?: string
          target_person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_connect_start_person_id_fkey"
            columns: ["start_person_id"]
            isOneToOne: false
            referencedRelation: "connect_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_connect_target_person_id_fkey"
            columns: ["target_person_id"]
            isOneToOne: false
            referencedRelation: "connect_people"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_connect_candidates: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          optimal_clicks: number | null
          planned_date: string | null
          start_person_id: string
          status: string
          target_person_id: string
          updated_at: string
          validation: Json
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          optimal_clicks?: number | null
          planned_date?: string | null
          start_person_id: string
          status?: string
          target_person_id: string
          updated_at?: string
          validation?: Json
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          optimal_clicks?: number | null
          planned_date?: string | null
          start_person_id?: string
          status?: string
          target_person_id?: string
          updated_at?: string
          validation?: Json
        }
        Relationships: []
      }
      daily_person: {
        Row: {
          created_at: string
          date: string
          number: number
          person_id: string
          published: boolean
        }
        Insert: {
          created_at?: string
          date: string
          number: number
          person_id: string
          published?: boolean
        }
        Update: {
          created_at?: string
          date?: string
          number?: number
          person_id?: string
          published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "daily_person_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "connect_people"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_top10: {
        Row: {
          challenge_id: string
          created_at: string
          date: string
          number: number
          published: boolean
        }
        Insert: {
          challenge_id: string
          created_at?: string
          date: string
          number: number
          published?: boolean
        }
        Update: {
          challenge_id?: string
          created_at?: string
          date?: string
          number?: number
          published?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      connect_catalog_counts: {
        Row: {
          challenge_actors: number | null
          connections: number | null
          films: number | null
          people: number | null
        }
        Relationships: []
      }
      connect_ingest_status: {
        Row: {
          items: number | null
          label: string | null
          last_update: string | null
          run_id: string | null
          run_stage: string | null
          run_status: string | null
          stage: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
