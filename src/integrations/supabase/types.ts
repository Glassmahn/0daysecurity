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
      alerts: {
        Row: {
          acknowledged_by: string | null
          created_at: string
          id: string
          message: string | null
          severity: string
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          message?: string | null
          severity?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          message?: string | null
          severity?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          criticality: string | null
          id: string
          ip_address: string | null
          location: string | null
          name: string
          owner_id: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criticality?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          name: string
          owner_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criticality?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          name?: string
          owner_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_snapshots: {
        Row: {
          controls_passing_pct: number
          created_at: string
          evidence_valid_pct: number
          frameworks_data: Json | null
          id: string
          overall_score: number
          snapshot_date: string
        }
        Insert: {
          controls_passing_pct?: number
          created_at?: string
          evidence_valid_pct?: number
          frameworks_data?: Json | null
          id?: string
          overall_score?: number
          snapshot_date?: string
        }
        Update: {
          controls_passing_pct?: number
          created_at?: string
          evidence_valid_pct?: number
          frameworks_data?: Json | null
          id?: string
          overall_score?: number
          snapshot_date?: string
        }
        Relationships: []
      }
      controls: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          framework_id: string | null
          id: string
          implementation_details: string | null
          last_reviewed: string | null
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          framework_id?: string | null
          id?: string
          implementation_details?: string | null
          last_reviewed?: string | null
          owner_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          framework_id?: string | null
          id?: string
          implementation_details?: string | null
          last_reviewed?: string | null
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          collected_at: string | null
          control_id: string | null
          created_at: string
          expires_at: string | null
          file_url: string | null
          id: string
          source: string | null
          status: string
          title: string
          type: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          collected_at?: string | null
          control_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          source?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          collected_at?: string | null
          control_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          source?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          passing_controls: number
          score: number | null
          total_controls: number
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          passing_controls?: number
          score?: number | null
          total_controls?: number
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          passing_controls?: number
          score?: number | null
          total_controls?: number
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reported_by: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_article_versions: {
        Row: {
          article_id: string
          category: string | null
          change_summary: string | null
          changed_by: string | null
          content: string | null
          created_at: string
          id: string
          status: string | null
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          category?: string | null
          change_summary?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string
          id?: string
          status?: string | null
          title: string
          version_number?: number
        }
        Update: {
          article_id?: string
          category?: string | null
          change_summary?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string
          id?: string
          status?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          current_version: number
          id: string
          search_vector: unknown
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          current_version?: number
          id?: string
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          current_version?: number
          id?: string
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          approved_by: string | null
          content: string | null
          created_at: string
          framework_id: string | null
          id: string
          owner_id: string | null
          review_date: string | null
          status: string
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          approved_by?: string | null
          content?: string | null
          created_at?: string
          framework_id?: string | null
          id?: string
          owner_id?: string | null
          review_date?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          approved_by?: string | null
          content?: string | null
          created_at?: string
          framework_id?: string | null
          id?: string
          owner_id?: string | null
          review_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          impact: number | null
          likelihood: number | null
          mitigation_plan: string | null
          owner_id: string | null
          residual_impact: number | null
          residual_likelihood: number | null
          risk_score: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_plan?: string | null
          owner_id?: string | null
          residual_impact?: number | null
          residual_likelihood?: number | null
          risk_score?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_plan?: string | null
          owner_id?: string | null
          residual_impact?: number | null
          residual_likelihood?: number | null
          risk_score?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          control_id: string | null
          created_at: string
          description: string | null
          id: string
          last_run: string | null
          name: string
          result: string | null
          schedule: string | null
          status: string
          updated_at: string
        }
        Insert: {
          control_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_run?: string | null
          name: string
          result?: string | null
          schedule?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          control_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_run?: string | null
          name?: string
          result?: string | null
          schedule?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          assessment_date: string | null
          contact_email: string | null
          contract_expiry: string | null
          contract_value: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          risk_tier: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assessment_date?: string | null
          contact_email?: string | null
          contract_expiry?: string | null
          contract_value?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          risk_tier?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string | null
          contact_email?: string | null
          contract_expiry?: string | null
          contract_value?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          risk_tier?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "auditor" | "viewer"
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
      app_role: ["admin", "analyst", "auditor", "viewer"],
    },
  },
} as const
