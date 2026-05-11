export type ReviewOutcome = 'pass' | 'fail' | 'hard'

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: number
          created_at: string
          username: string | null
          email: string | null
          password: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          username?: string | null
          email?: string | null
          password?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          username?: string | null
          email?: string | null
          password?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          user_id: number
          name: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: number
          name: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          name?: string
          parent_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          user_id: number
          folder_id: string | null
          front: string
          back: string
          hint: string | null
          color: string | null
          is_flagged: boolean
          difficulty: number
          repeat_interval: number
          last_review_time: string | null
          next_review_time: string | null
          review_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: number
          folder_id?: string | null
          front: string
          back: string
          hint?: string | null
          color?: string | null
          is_flagged?: boolean
          difficulty?: number
          repeat_interval?: number
          last_review_time?: string | null
          next_review_time?: string | null
          review_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          folder_id?: string | null
          front?: string
          back?: string
          hint?: string | null
          color?: string | null
          is_flagged?: boolean
          difficulty?: number
          repeat_interval?: number
          last_review_time?: string | null
          next_review_time?: string | null
          review_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cards_folder_id_fkey'
            columns: ['folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          user_id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: number
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      card_tags: {
        Row: {
          card_id: string
          tag_id: string
        }
        Insert: {
          card_id: string
          tag_id: string
        }
        Update: {
          card_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'card_tags_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'card_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          user_id: number
          name: string
          is_completed: boolean
          start_date: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: number
          name: string
          is_completed?: boolean
          start_date?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          name?: string
          is_completed?: boolean
          start_date?: string | null
          due_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      task_folders: {
        Row: {
          task_id: string
          folder_id: string
        }
        Insert: {
          task_id: string
          folder_id: string
        }
        Update: {
          task_id?: string
          folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_folders_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_folders_folder_id_fkey'
            columns: ['folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      user_settings: {
        Row: {
          id: number
          daily_goal: number
          updated_at: string
        }
        Insert: {
          id: number
          daily_goal?: number
          updated_at?: string
        }
        Update: {
          id?: number
          daily_goal?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          id: number
          current_streak: number
          longest_streak: number
          last_reviewed_date: string | null
          updated_at: string
        }
        Insert: {
          id: number
          current_streak?: number
          longest_streak?: number
          last_reviewed_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          current_streak?: number
          longest_streak?: number
          last_reviewed_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_sessions: {
        Row: {
          id: string
          user_id: number
          task_id: string | null
          started_at: string
          ended_at: string | null
          cards_reviewed: number
          cards_passed: number
          cards_failed: number
        }
        Insert: {
          id?: string
          user_id: number
          task_id?: string | null
          started_at?: string
          ended_at?: string | null
          cards_reviewed?: number
          cards_passed?: number
          cards_failed?: number
        }
        Update: {
          id?: string
          user_id?: number
          task_id?: string | null
          started_at?: string
          ended_at?: string | null
          cards_reviewed?: number
          cards_passed?: number
          cards_failed?: number
        }
        Relationships: []
      }
      card_reviews: {
        Row: {
          id: string
          card_id: string
          session_id: string | null
          reviewed_at: string
          outcome: ReviewOutcome
          interval_before: number
          interval_after: number
        }
        Insert: {
          id?: string
          card_id: string
          session_id?: string | null
          reviewed_at?: string
          outcome: ReviewOutcome
          interval_before?: number
          interval_after?: number
        }
        Update: {
          id?: string
          card_id?: string
          session_id?: string | null
          reviewed_at?: string
          outcome?: ReviewOutcome
          interval_before?: number
          interval_after?: number
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          id: string
          user_id: number
          imported_at: string
          folder_id: string | null
          total_cards: number
          success_count: number
          error_count: number
        }
        Insert: {
          id?: string
          user_id: number
          imported_at?: string
          folder_id?: string | null
          total_cards?: number
          success_count?: number
          error_count?: number
        }
        Update: {
          id?: string
          user_id?: number
          imported_at?: string
          folder_id?: string | null
          total_cards?: number
          success_count?: number
          error_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      folder_stats: {
        Row: {
          folder_id: string
          folder_name: string
          total_cards: number
          mature_cards: number
          due_cards: number
          flagged_cards: number
        }
        Relationships: []
      }
      task_progress: {
        Row: {
          task_id: string
          task_name: string
          total_cards: number
          due_cards: number
          total_reviews: number
          passed_reviews: number
          failed_reviews: number
          hard_reviews: number
        }
        Relationships: []
      }
    }
    Enums: {
      review_outcome: ReviewOutcome
    }
    Functions: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type UserRow = Database['public']['Tables']['User']['Row']
export type FolderRow = Database['public']['Tables']['folders']['Row']
export type CardRow = Database['public']['Tables']['cards']['Row']
export type TagRow = Database['public']['Tables']['tags']['Row']
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type ReviewSessionRow = Database['public']['Tables']['review_sessions']['Row']
export type CardReviewRow = Database['public']['Tables']['card_reviews']['Row']
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']
export type UserStreakRow = Database['public']['Tables']['user_streaks']['Row']
export type ImportLogRow = Database['public']['Tables']['import_logs']['Row']
export type FolderStats = Database['public']['Views']['folder_stats']['Row']
export type TaskProgress = Database['public']['Views']['task_progress']['Row']
