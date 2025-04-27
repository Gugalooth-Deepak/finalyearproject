export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          event_date: string
          created_at: string
          total_seats: number
          available_seats: number
          image_url: string | null
          creator_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          event_date: string
          created_at?: string
          total_seats: number
          available_seats?: number
          image_url?: string | null
          creator_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          event_date?: string
          created_at?: string
          total_seats?: number
          available_seats?: number
          image_url?: string | null
          creator_id?: string
        }
      }
      feedback: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          registration_date: string
          status: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          registration_date?: string
          status?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          registration_date?: string
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}