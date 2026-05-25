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
      access_review_assignments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          reviewee_id: string
          reviewer_id: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          reviewee_id: string
          reviewer_id?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          reviewee_id?: string
          reviewer_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_review_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "access_review_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_review_assignments_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      access_review_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged_by: string | null
          affected_asset_id: string | null
          affected_control_id: string | null
          assigned_to: string | null
          created_at: string
          id: string
          message: string | null
          org_id: string
          severity: string
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_by?: string | null
          affected_asset_id?: string | null
          affected_control_id?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string | null
          org_id?: string
          severity?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_by?: string | null
          affected_asset_id?: string | null
          affected_control_id?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string | null
          org_id?: string
          severity?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_affected_asset_id_fkey"
            columns: ["affected_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_affected_control_id_fkey"
            columns: ["affected_control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          criticality: string | null
          data_classification: string | null
          id: string
          ip_address: string | null
          location: string | null
          name: string
          org_id: string
          owner_id: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criticality?: string | null
          data_classification?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          name: string
          org_id?: string
          owner_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criticality?: string | null
          data_classification?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          name?: string
          org_id?: string
          owner_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_evidence_requests: {
        Row: {
          assigned_to_id: string | null
          audit_id: string
          created_at: string
          description: string | null
          due_date: string | null
          finding_id: string | null
          id: string
          notes: string | null
          org_id: string
          requested_by_id: string | null
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_id?: string | null
          audit_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          requested_by_id?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string | null
          audit_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          requested_by_id?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_requests_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_evidence_requests_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "audit_findings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string
          control_id: string | null
          created_at: string
          description: string | null
          evidence_refs: string[] | null
          id: string
          org_id: string
          remediation: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audit_id: string
          control_id?: string | null
          created_at?: string
          description?: string | null
          evidence_refs?: string[] | null
          id?: string
          org_id?: string
          remediation?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audit_id?: string
          control_id?: string | null
          created_at?: string
          description?: string | null
          evidence_refs?: string[] | null
          id?: string
          org_id?: string
          remediation?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          org_id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audits: {
        Row: {
          created_at: string
          end_date: string | null
          framework: string | null
          id: string
          lead_auditor_id: string | null
          notes: string | null
          org_id: string
          scope: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          framework?: string | null
          id?: string
          lead_auditor_id?: string | null
          notes?: string | null
          org_id?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          framework?: string | null
          id?: string
          lead_auditor_id?: string | null
          notes?: string | null
          org_id?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_snapshots: {
        Row: {
          created_at: string
          failing: number
          framework: string
          id: string
          implemented: number
          in_progress: number
          not_started: number
          org_id: string
          score_pct: number
          snapshot_date: string
          total_controls: number
        }
        Insert: {
          created_at?: string
          failing?: number
          framework: string
          id?: string
          implemented?: number
          in_progress?: number
          not_started?: number
          org_id?: string
          score_pct?: number
          snapshot_date?: string
          total_controls?: number
        }
        Update: {
          created_at?: string
          failing?: number
          framework?: string
          id?: string
          implemented?: number
          in_progress?: number
          not_started?: number
          org_id?: string
          score_pct?: number
          snapshot_date?: string
          total_controls?: number
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
      custom_field_definitions: {
        Row: {
          created_at: string
          entity_type: string
          field_name: string
          field_type: string
          id: string
          options: Json | null
          org_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_name: string
          field_type?: string
          id?: string
          options?: Json | null
          org_id?: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_name?: string
          field_type?: string
          id?: string
          options?: Json | null
          org_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          field_definition_id: string
          id: string
          org_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          field_definition_id: string
          id?: string
          org_id?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          field_definition_id?: string
          id?: string
          org_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
      incident_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          incident_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          incident_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          incident_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          attachments: Json
          created_at: string
          description: string | null
          id: string
          org_id: string
          reported_by: string | null
          resolved_at: string | null
          response_checklist: Json | null
          root_cause: string | null
          severity: string
          status: string
          timeline: Json
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          reported_by?: string | null
          resolved_at?: string | null
          response_checklist?: Json | null
          root_cause?: string | null
          severity?: string
          status?: string
          timeline?: Json
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          reported_by?: string | null
          resolved_at?: string | null
          response_checklist?: Json | null
          root_cause?: string | null
          severity?: string
          status?: string
          timeline?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          config: Json | null
          controls_mapped: number
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          last_synced_at: string | null
          name: string
          org_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json | null
          controls_mapped?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          org_id?: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json | null
          controls_mapped?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          org_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          records_affected: number
          started_at: string
          status: string
        }
        Insert: {
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          records_affected?: number
          started_at?: string
          status: string
        }
        Update: {
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          records_affected?: number
          started_at?: string
          status?: string
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          control_ids: string[]
          created_at: string
          current_version: number
          framework_ids: string[]
          id: string
          org_id: string
          search_vector: unknown
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          version_history: unknown
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          control_ids?: string[]
          created_at?: string
          current_version?: number
          framework_ids?: string[]
          id?: string
          org_id?: string
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          version_history?: unknown
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          control_ids?: string[]
          created_at?: string
          current_version?: number
          framework_ids?: string[]
          id?: string
          org_id?: string
          search_vector?: unknown
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          version_history?: unknown
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          access_review_email: boolean
          access_review_slack: boolean
          created_at: string
          critical_alerts_email: boolean
          critical_alerts_slack: boolean
          evidence_expiring_email: boolean
          evidence_expiring_slack: boolean
          high_alerts_email: boolean
          high_alerts_slack: boolean
          id: string
          org_id: string
          policy_review_email: boolean
          policy_review_slack: boolean
          updated_at: string
          user_id: string
          weekly_digest_email: boolean
          weekly_digest_slack: boolean
        }
        Insert: {
          access_review_email?: boolean
          access_review_slack?: boolean
          created_at?: string
          critical_alerts_email?: boolean
          critical_alerts_slack?: boolean
          evidence_expiring_email?: boolean
          evidence_expiring_slack?: boolean
          high_alerts_email?: boolean
          high_alerts_slack?: boolean
          id?: string
          org_id?: string
          policy_review_email?: boolean
          policy_review_slack?: boolean
          updated_at?: string
          user_id: string
          weekly_digest_email?: boolean
          weekly_digest_slack?: boolean
        }
        Update: {
          access_review_email?: boolean
          access_review_slack?: boolean
          created_at?: string
          critical_alerts_email?: boolean
          critical_alerts_slack?: boolean
          evidence_expiring_email?: boolean
          evidence_expiring_slack?: boolean
          high_alerts_email?: boolean
          high_alerts_slack?: boolean
          id?: string
          org_id?: string
          policy_review_email?: boolean
          policy_review_slack?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest_email?: boolean
          weekly_digest_slack?: boolean
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          id: string
          industry: string
          logo_url: string | null
          name: string
          org_id: string
          plan: string
          primary_contact: string
          settings: Json | null
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          org_id?: string
          plan?: string
          primary_contact?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          org_id?: string
          plan?: string
          primary_contact?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      orgs: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          plan: string | null
          settings: Json | null
          size: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          plan?: string | null
          settings?: Json | null
          size?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          plan?: string | null
          settings?: Json | null
          size?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      personnel: {
        Row: {
          access_review_status: string
          created_at: string
          department: string | null
          email: string
          id: string
          last_access_review: string | null
          last_training_completed: string | null
          name: string
          org_id: string
          role: string
          title: string | null
          training_status: string
          updated_at: string
        }
        Insert: {
          access_review_status?: string
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          last_access_review?: string | null
          last_training_completed?: string | null
          name: string
          org_id?: string
          role?: string
          title?: string | null
          training_status?: string
          updated_at?: string
        }
        Update: {
          access_review_status?: string
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          last_access_review?: string | null
          last_training_completed?: string | null
          name?: string
          org_id?: string
          role?: string
          title?: string | null
          training_status?: string
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
      policy_acknowledgments: {
        Row: {
          acknowledged_at: string
          created_at: string
          id: string
          org_id: string
          policy_id: string
          status: string
          user_id: string
          version_acknowledged: string
        }
        Insert: {
          acknowledged_at?: string
          created_at?: string
          id?: string
          org_id?: string
          policy_id: string
          status?: string
          user_id: string
          version_acknowledged?: string
        }
        Update: {
          acknowledged_at?: string
          created_at?: string
          id?: string
          org_id?: string
          policy_id?: string
          status?: string
          user_id?: string
          version_acknowledged?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_acknowledgments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
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
      report_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json | null
          format: string
          id: string
          name: string
          org_id: string
          recipients: string[] | null
          report_type: string
          schedule: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format?: string
          id?: string
          name: string
          org_id?: string
          recipients?: string[] | null
          report_type: string
          schedule?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format?: string
          id?: string
          name?: string
          org_id?: string
          recipients?: string[] | null
          report_type?: string
          schedule?: string
          status?: string
          updated_at?: string
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
      sso_configurations: {
        Row: {
          attribute_mapping: Json | null
          certificate: string | null
          created_at: string
          entity_id: string | null
          id: string
          org_id: string
          provider: string
          sso_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attribute_mapping?: Json | null
          certificate?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          org_id?: string
          provider?: string
          sso_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attribute_mapping?: Json | null
          certificate?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          org_id?: string
          provider?: string
          sso_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          control_id: string | null
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          last_run: string | null
          name: string
          next_run: string | null
          org_id: string
          result: string | null
          result_history: Json
          schedule: string | null
          status: string
          updated_at: string
        }
        Insert: {
          control_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_run?: string | null
          name: string
          next_run?: string | null
          org_id?: string
          result?: string | null
          result_history?: Json
          schedule?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          control_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_run?: string | null
          name?: string
          next_run?: string | null
          org_id?: string
          result?: string | null
          result_history?: Json
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
      training_assignments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          org_id: string
          score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          org_id?: string
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          org_id?: string
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string | null
          content: Json | null
          control_ids: string[]
          created_at: string
          description: string | null
          duration_minutes: number | null
          framework_ids: string[]
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: Json | null
          control_ids?: string[]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          framework_ids?: string[]
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: Json | null
          control_ids?: string[]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          framework_ids?: string[]
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_quiz_attempts: {
        Row: {
          answers: Json
          assignment_id: string
          completed_at: string | null
          id: string
          org_id: string
          passed: boolean
          score: number
          started_at: string
        }
        Insert: {
          answers: Json
          assignment_id: string
          completed_at?: string | null
          id?: string
          org_id?: string
          passed: boolean
          score: number
          started_at?: string
        }
        Update: {
          answers?: Json
          assignment_id?: string
          completed_at?: string | null
          id?: string
          org_id?: string
          passed?: boolean
          score?: number
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quiz_questions: {
        Row: {
          correct_index: number
          course_id: string
          explanation: string | null
          id: string
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          course_id: string
          explanation?: string | null
          id?: string
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          course_id?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subprocessors: {
        Row: {
          country: string
          created_at: string
          data_handled: string
          id: string
          name: string
          org_id: string
          purpose: string
          status: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          data_handled?: string
          id?: string
          name: string
          org_id?: string
          purpose: string
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          data_handled?: string
          id?: string
          name?: string
          org_id?: string
          purpose?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      trust_portal_shares: {
        Row: {
          access_count: number
          allowed_domains: string[]
          created_at: string
          created_by: string | null
          expires_at: string | null
          frameworks: string[]
          id: string
          include_evidence: boolean
          include_reports: boolean
          last_accessed_at: string | null
          name: string
          org_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          allowed_domains?: string[]
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          frameworks?: string[]
          id?: string
          include_evidence?: boolean
          include_reports?: boolean
          last_accessed_at?: string | null
          name: string
          org_id?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          allowed_domains?: string[]
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          frameworks?: string[]
          id?: string
          include_evidence?: boolean
          include_reports?: boolean
          last_accessed_at?: string | null
          name?: string
          org_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          org_id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_assessments: {
        Row: {
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          org_id: string
          responded_at: string | null
          responses: Json | null
          score: number | null
          sent_at: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          responded_at?: string | null
          responses?: Json | null
          score?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          responded_at?: string | null
          responses?: Json | null
          score?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_assessments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          assessment_date: string | null
          contact_email: string | null
          contract_expiry: string | null
          contract_value: number | null
          created_at: string
          data_access: string | null
          documents: Json
          id: string
          name: string
          notes: string | null
          org_id: string
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
          data_access?: string | null
          documents?: Json
          id?: string
          name: string
          notes?: string | null
          org_id?: string
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
          data_access?: string | null
          documents?: Json
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
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
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_current_org_id: { Args: { org_id: string }; Returns: undefined }
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
