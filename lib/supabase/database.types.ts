/**
 * Tipos alineados con el esquema REAL de Supabase (FotoHabit).
 * profiles: id, username, avatar_url, level, created_at
 * habits: id, user_id, title, category, streak_days, created_at
 * posts: id, user_id, habit_id, image_url, caption, visibility, created_at
 * daily_validations: id, user_id, category, validation_date, created_at
 * bucket público: posts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          level: number | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          level?: number | null
          created_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string | null
          streak_days: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: string | null
          streak_days?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string | null
          streak_days?: number | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          image_url: string
          caption: string | null
          visibility: 'global' | 'network'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          image_url: string
          caption?: string | null
          visibility?: 'global' | 'network'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          image_url?: string
          caption?: string | null
          visibility?: 'global' | 'network'
          created_at?: string
        }
      }
      daily_validations: {
        Row: {
          id: string
          user_id: string
          category: string
          validation_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          validation_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          validation_date?: string
          created_at?: string
        }
      }
    }
  }
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type HabitRow = Database['public']['Tables']['habits']['Row']
export type PostRow = Database['public']['Tables']['posts']['Row']

export type PostWithRelations = PostRow & {
  profiles: ProfileRow | ProfileRow[] | null
  habits: HabitRow | HabitRow[] | null
}
