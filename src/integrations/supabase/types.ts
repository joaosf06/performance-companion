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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athlete_documents: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_url: string
          id: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_url: string
          id?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      athlete_stats: {
        Row: {
          athlete_id: string
          body_zone: string | null
          category: string
          coach_id: string
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          season_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          body_zone?: string | null
          category?: string
          coach_id: string
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: number
          season_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          body_zone?: string | null
          category?: string
          coach_id?: string
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          duration_minutes: number
          id: string
          slot_date: string
          source: string
          source_id: string | null
          start_time: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          slot_date: string
          source: string
          source_id?: string | null
          start_time: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          slot_date?: string
          source?: string
          source_id?: string | null
          start_time?: string
        }
        Relationships: []
      }
      coach_athletes: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      coach_date_slots: {
        Row: {
          capacity: number | null
          coach_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_blocked: boolean
          note: string | null
          slot_date: string
          start_time: string | null
        }
        Insert: {
          capacity?: number | null
          coach_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_blocked?: boolean
          note?: string | null
          slot_date: string
          start_time?: string | null
        }
        Update: {
          capacity?: number | null
          coach_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_blocked?: boolean
          note?: string | null
          slot_date?: string
          start_time?: string | null
        }
        Relationships: []
      }
      coach_recurring_slots: {
        Row: {
          active: boolean
          capacity: number
          coach_id: string
          created_at: string
          duration_minutes: number
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          capacity?: number
          coach_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          capacity?: number
          coach_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: []
      }
      coach_schedule_settings: {
        Row: {
          coach_id: string
          created_at: string
          min_cancel_hours: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          min_cancel_hours?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          min_cancel_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      complementary_workout_items: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          library_file_id: string | null
          load: string | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          library_file_id?: string | null
          load?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          library_file_id?: string | null
          load?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complementary_workout_items_library_file_id_fkey"
            columns: ["library_file_id"]
            isOneToOne: false
            referencedRelation: "library_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complementary_workout_items_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "complementary_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      complementary_workouts: {
        Row: {
          athlete_id: string
          coach_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_questionnaire_assignments: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string
          id: string
          questionnaire_id: string
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questionnaire_id: string
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questionnaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_questionnaire_assignments_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "custom_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questionnaire_fields: {
        Row: {
          field_type: string
          id: string
          label: string
          options: Json | null
          questionnaire_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          field_type?: string
          id?: string
          label: string
          options?: Json | null
          questionnaire_id: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          field_type?: string
          id?: string
          label?: string
          options?: Json | null
          questionnaire_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_questionnaire_fields_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "custom_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questionnaire_responses: {
        Row: {
          assignment_id: string
          created_at: string
          field_id: string
          file_url: string | null
          id: string
          number_value: number | null
          text_value: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          field_id: string
          file_url?: string | null
          id?: string
          number_value?: number | null
          text_value?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          field_id?: string
          file_url?: string | null
          id?: string
          number_value?: number | null
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_questionnaire_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "custom_questionnaire_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_questionnaire_responses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_questionnaire_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questionnaires: {
        Row: {
          attachments: Json | null
          coach_id: string
          created_at: string
          description: string | null
          id: string
          next_run_at: string | null
          recurrence: string
          recurrence_active: boolean
          recurrence_day: number | null
          recurrence_hour: number
          title: string
        }
        Insert: {
          attachments?: Json | null
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          next_run_at?: string | null
          recurrence?: string
          recurrence_active?: boolean
          recurrence_day?: number | null
          recurrence_hour?: number
          title: string
        }
        Update: {
          attachments?: Json | null
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          next_run_at?: string | null
          recurrence?: string
          recurrence_active?: boolean
          recurrence_day?: number | null
          recurrence_hour?: number
          title?: string
        }
        Relationships: []
      }
      free_trial_requests: {
        Row: {
          age: number
          availability: string
          club: string
          created_at: string
          email: string
          full_name: string
          id: string
          level: string
          notes: string | null
          phone: string | null
          position: string
          preferred_foot: string
        }
        Insert: {
          age: number
          availability: string
          club: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          level: string
          notes?: string | null
          phone?: string | null
          position: string
          preferred_foot: string
        }
        Update: {
          age?: number
          availability?: string
          club?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          level?: string
          notes?: string | null
          phone?: string | null
          position?: string
          preferred_foot?: string
        }
        Relationships: []
      }
      library_files: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          file_name: string
          file_type: string | null
          file_url: string
          folder_id: string
          id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          folder_id: string
          id?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      library_folder_assignments: {
        Row: {
          athlete_id: string
          created_at: string
          folder_id: string
          id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          folder_id: string
          id?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      library_folders: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          current_club: string | null
          full_name: string
          guardian_phone: string | null
          id: string
          instagram: string | null
          phone: string | null
          position: string | null
          short_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_club?: string | null
          full_name?: string
          guardian_phone?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          position?: string | null
          short_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_club?: string | null
          full_name?: string
          guardian_phone?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          position?: string | null
          short_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questionnaire_recurrence_athletes: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          questionnaire_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          questionnaire_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          questionnaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_recurrence_athletes_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "custom_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      training_reports: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
          improvements: string | null
          intensity_score: number | null
          mental_observations: string | null
          objective: string
          strengths: string | null
          technical_score: number | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
          improvements?: string | null
          intensity_score?: number | null
          mental_observations?: string | null
          objective: string
          strengths?: string | null
          technical_score?: number | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          improvements?: string | null
          intensity_score?: number | null
          mental_observations?: string | null
          objective?: string
          strengths?: string | null
          technical_score?: number | null
        }
        Relationships: []
      }
      upgrade_requests: {
        Row: {
          created_at: string
          id: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_questionnaires: {
        Row: {
          confidence: number
          created_at: string
          fatigue: number
          id: string
          minutes_played: number
          motivation: number
          muscle_pain: number
          player_id: string
          sleep_quality: number
          week_start: string
        }
        Insert: {
          confidence: number
          created_at?: string
          fatigue: number
          id?: string
          minutes_played?: number
          motivation: number
          muscle_pain: number
          player_id: string
          sleep_quality: number
          week_start: string
        }
        Update: {
          confidence?: number
          created_at?: string
          fatigue?: number
          id?: string
          minutes_played?: number
          motivation?: number
          muscle_pain?: number
          player_id?: string
          sleep_quality?: number
          week_start?: string
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
      app_role: "player" | "coach"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["player", "coach"],
    },
  },
} as const
