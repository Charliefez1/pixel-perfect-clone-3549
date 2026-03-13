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
      activities: {
        Row: {
          activity_date: string
          body: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          organisation_id: string | null
          source: string | null
          subject: string | null
          type: string
        }
        Insert: {
          activity_date?: string
          body?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          organisation_id?: string | null
          source?: string | null
          subject?: string | null
          type?: string
        }
        Update: {
          activity_date?: string
          body?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          organisation_id?: string | null
          source?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_title: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_portal_access: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deal_id: string | null
          id: string
          project_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deal_id?: string | null
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          job_title: string | null
          last_contacted: string | null
          last_name: string
          linkedin_url: string | null
          notes: string | null
          organisation_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_contacted?: string | null
          last_name: string
          linkedin_url?: string | null
          notes?: string | null
          organisation_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_contacted?: string | null
          last_name?: string
          linkedin_url?: string | null
          notes?: string | null
          organisation_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          organisation_id: string | null
          proposal_id: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          proposal_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          proposal_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          bespoke_details: Json | null
          contact_id: string | null
          contract_signed_at: string | null
          created_at: string
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          notes: string | null
          organisation_id: string | null
          owner: string | null
          owner_id: string | null
          package_size: string | null
          probability: number | null
          proposal_sent_at: string | null
          proposal_url: string | null
          service_type: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          stage_entered_at: string
          title: string
          total_workshops: number | null
          updated_at: string
          value: number | null
          weighted_value: number | null
          workshops_aware: number | null
          workshops_bespoke: number | null
          workshops_champion: number | null
          workshops_leader: number | null
          workshops_manager: number | null
        }
        Insert: {
          bespoke_details?: Json | null
          contact_id?: string | null
          contract_signed_at?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          organisation_id?: string | null
          owner?: string | null
          owner_id?: string | null
          package_size?: string | null
          probability?: number | null
          proposal_sent_at?: string | null
          proposal_url?: string | null
          service_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          stage_entered_at?: string
          title: string
          total_workshops?: number | null
          updated_at?: string
          value?: number | null
          weighted_value?: number | null
          workshops_aware?: number | null
          workshops_bespoke?: number | null
          workshops_champion?: number | null
          workshops_leader?: number | null
          workshops_manager?: number | null
        }
        Update: {
          bespoke_details?: Json | null
          contact_id?: string | null
          contract_signed_at?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          organisation_id?: string | null
          owner?: string | null
          owner_id?: string | null
          package_size?: string | null
          probability?: number | null
          proposal_sent_at?: string | null
          proposal_url?: string | null
          service_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          stage_entered_at?: string
          title?: string
          total_workshops?: number | null
          updated_at?: string
          value?: number | null
          weighted_value?: number | null
          workshops_aware?: number | null
          workshops_bespoke?: number | null
          workshops_champion?: number | null
          workshops_leader?: number | null
          workshops_manager?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          deal_id: string | null
          delegate_count: number | null
          delivery_date: string | null
          feedback_received: boolean | null
          feedback_sent: boolean | null
          id: string
          kirkpatrick_level: number | null
          neuro_stage: string | null
          notes: string | null
          organisation_id: string | null
          post_assessment_complete: boolean | null
          pre_assessment_complete: boolean | null
          project_id: string | null
          satisfaction_score: number | null
          service_type: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          delegate_count?: number | null
          delivery_date?: string | null
          feedback_received?: boolean | null
          feedback_sent?: boolean | null
          id?: string
          kirkpatrick_level?: number | null
          neuro_stage?: string | null
          notes?: string | null
          organisation_id?: string | null
          post_assessment_complete?: boolean | null
          pre_assessment_complete?: boolean | null
          project_id?: string | null
          satisfaction_score?: number | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          delegate_count?: number | null
          delivery_date?: string | null
          feedback_received?: boolean | null
          feedback_sent?: boolean | null
          id?: string
          kirkpatrick_level?: number | null
          neuro_stage?: string | null
          notes?: string | null
          organisation_id?: string | null
          post_assessment_complete?: boolean | null
          pre_assessment_complete?: boolean | null
          project_id?: string | null
          satisfaction_score?: number | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tasks: {
        Row: {
          assignee: string | null
          created_at: string
          delivery_id: string
          due_date: string | null
          id: string
          sort_order: number | null
          status: string
          title: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          delivery_id: string
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          title: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          delivery_id?: string
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tasks_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_documents: {
        Row: {
          content_type: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          answers: Json
          delivery_id: string | null
          form_id: string
          id: string
          project_id: string | null
          respondent_email: string | null
          respondent_name: string | null
          submitted_at: string
        }
        Insert: {
          answers?: Json
          delivery_id?: string | null
          form_id: string
          id?: string
          project_id?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          submitted_at?: string
        }
        Update: {
          answers?: Json
          delivery_id?: string | null
          form_id?: string
          id?: string
          project_id?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          fields_json: Json | null
          id: string
          responses_count: number | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields_json?: Json | null
          id?: string
          responses_count?: number | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields_json?: Json | null
          id?: string
          responses_count?: number | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          total: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contract_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          notes: string | null
          organisation_id: string | null
          paid_at: string | null
          paid_date: string | null
          pdf_url: string | null
          project_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number | null
          total: number | null
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
          viewed_at: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          paid_at?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          paid_at?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          sector: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          sector?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          sector?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          theme_accent: string
          theme_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          theme_accent?: string
          theme_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          theme_accent?: string
          theme_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          label: string
          milestone_key: string
          project_id: string
          sort_order: number
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          label: string
          milestone_key: string
          project_id: string
          sort_order?: number
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          label?: string
          milestone_key?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          deal_id: string | null
          description: string | null
          end_date: string | null
          id: string
          invoiced: number | null
          name: string
          neuro_phase: Database["public"]["Enums"]["neuro_phase"] | null
          organisation_id: string | null
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          invoiced?: number | null
          name: string
          neuro_phase?: Database["public"]["Enums"]["neuro_phase"] | null
          organisation_id?: string | null
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          invoiced?: number | null
          name?: string
          neuro_phase?: Database["public"]["Enums"]["neuro_phase"] | null
          organisation_id?: string | null
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          declined_at: string | null
          id: string
          notes: string | null
          organisation_id: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          valid_until: string | null
          value: number | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          declined_at?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          valid_until?: string | null
          value?: number | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          declined_at?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          issue_date: string | null
          notes: string | null
          organisation_id: string | null
          po_number: string
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          po_number: string
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          po_number?: string
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_cards: {
        Row: {
          created_at: string
          currency: string | null
          day_rate: number | null
          half_day_rate: number | null
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          role: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          day_rate?: number | null
          half_day_rate?: number | null
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          role?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          day_rate?: number | null
          half_day_rate?: number | null
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          role?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          default_duration_days: number | null
          default_price: number | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          default_duration_days?: number | null
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          default_duration_days?: number | null
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          facilitator_id: string | null
          id: string
          location: string | null
          notes: string | null
          project_id: string | null
          session_date: string | null
          session_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          facilitator_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          session_date?: string | null
          session_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          facilitator_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          session_date?: string | null
          session_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string | null
          created_at: string
          id: string
          name: string
          package_size: string | null
          service_type: string | null
          tasks_json: Json | null
          template_type: string | null
          variables: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          name: string
          package_size?: string | null
          service_type?: string | null
          tasks_json?: Json | null
          template_type?: string | null
          variables?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          package_size?: string | null
          service_type?: string | null
          tasks_json?: Json | null
          template_type?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          billable: boolean | null
          created_at: string
          date: string
          description: string | null
          duration_minutes: number
          id: string
          project_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_form_responses: {
        Args: { form_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "verbal"
        | "won"
        | "lost"
      delivery_status:
        | "planning"
        | "materials_prep"
        | "scheduled"
        | "in_progress"
        | "delivered"
        | "follow_up"
        | "complete"
      invoice_status: "draft" | "sent" | "viewed" | "paid" | "overdue"
      neuro_phase: "needs" | "engage" | "understand" | "realise" | "ongoing"
      project_status: "setup" | "active" | "paused" | "completed"
      service_type:
        | "workshop"
        | "programme"
        | "coaching"
        | "keynote"
        | "audit"
        | "sera_pilot"
      task_priority: "critical" | "high" | "medium" | "low"
      task_status: "todo" | "in_progress" | "blocked" | "done"
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
      app_role: ["admin", "user"],
      deal_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "verbal",
        "won",
        "lost",
      ],
      delivery_status: [
        "planning",
        "materials_prep",
        "scheduled",
        "in_progress",
        "delivered",
        "follow_up",
        "complete",
      ],
      invoice_status: ["draft", "sent", "viewed", "paid", "overdue"],
      neuro_phase: ["needs", "engage", "understand", "realise", "ongoing"],
      project_status: ["setup", "active", "paused", "completed"],
      service_type: [
        "workshop",
        "programme",
        "coaching",
        "keynote",
        "audit",
        "sera_pilot",
      ],
      task_priority: ["critical", "high", "medium", "low"],
      task_status: ["todo", "in_progress", "blocked", "done"],
    },
  },
} as const
