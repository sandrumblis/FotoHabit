/**
 * Tipos alineados con el esquema FotoHabit en Supabase.
 * Tablas: profiles, habits, posts · bucket público: posts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          accent: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          accent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          accent?: string | null
          created_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          category_key: string | null
          accent: string | null
          streak_days: number | null
          level: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category_key?: string | null
          accent?: string | null
          streak_days?: number | null
          level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category_key?: string | null
          accent?: string | null
          streak_days?: number | null
          level?: number | null
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
          likes_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          image_url: string
          caption?: string | null
          likes_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          image_url?: string
          caption?: string | null
          likes_count?: number | null
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
