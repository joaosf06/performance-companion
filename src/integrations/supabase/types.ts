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
          title: string
        }
        Insert: {
          attachments?: Json | null
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          attachments?: Json | null
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
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
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          short_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          short_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          short_id?: string | null
          updated_at?: string
          user_id?: string
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
      generate_short_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coach_of_athlete: {
        Args: { _athlete_id: string; _coach_id: string }
        Returns: boolean
      }
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
      app_role: ["player", "coach"],
    },
  },
} as const
