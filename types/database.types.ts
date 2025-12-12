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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          name: string
          points: number | null
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          note: string | null
          page_number: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          page_number: number
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          author_id: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          free_preview_pages: number | null
          genres: string[] | null
          id: string
          is_premium: boolean | null
          isbn: string | null
          language: string | null
          last_synced_at: string | null
          level: string | null
          publication_year: number | null
          publisher: string | null
          rating: number | null
          review_count: number | null
          sanity_id: string
          slug: string
          status: string | null
          subtitle: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author: string
          author_id?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          free_preview_pages?: number | null
          genres?: string[] | null
          id?: string
          is_premium?: boolean | null
          isbn?: string | null
          language?: string | null
          last_synced_at?: string | null
          level?: string | null
          publication_year?: number | null
          publisher?: string | null
          rating?: number | null
          review_count?: number | null
          sanity_id: string
          slug: string
          status?: string | null
          subtitle?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string
          author_id?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          free_preview_pages?: number | null
          genres?: string[] | null
          id?: string
          is_premium?: boolean | null
          isbn?: string | null
          language?: string | null
          last_synced_at?: string | null
          level?: string | null
          publication_year?: number | null
          publisher?: string | null
          rating?: number | null
          review_count?: number | null
          sanity_id?: string
          slug?: string
          status?: string | null
          subtitle?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      gemini_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      highlights: {
        Row: {
          book_id: string
          color: string | null
          created_at: string | null
          id: string
          note: string | null
          page_number: number
          text: string
          user_id: string
        }
        Insert: {
          book_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          page_number: number
          text: string
          user_id: string
        }
        Update: {
          book_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_books: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liked_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_content_cache: {
        Row: {
          book_id: string
          content_hash: string
          downloaded_at: string | null
          encrypted: boolean | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          content_hash: string
          downloaded_at?: string | null
          encrypted?: boolean | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          content_hash?: string
          downloaded_at?: string | null
          encrypted?: boolean | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_content_cache_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_content_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          amount: number
          authority: string
          created_at: string | null
          id: string
          plan_id: string
          ref_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          authority: string
          created_at?: string | null
          id?: string
          plan_id: string
          ref_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          authority?: string
          created_at?: string | null
          id?: string
          plan_id?: string
          ref_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          age_group: string | null
          allow_friend_requests: boolean | null
          avatar_custom_url: string | null
          avatar_preset_id: number | null
          avatar_type: string | null
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          birth_date: string | null
          birth_date_jalali: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          education_level: string | null
          email: string | null
          email_verified: boolean | null
          english_level: string | null
          favorite_genres: string[] | null
          field_of_study: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean | null
          is_profile_public: boolean | null
          language_preference: string | null
          last_login_at: string | null
          last_name: string | null
          last_read_at: string | null
          learning_goal: string | null
          level: string | null
          login_count: number | null
          longest_streak: number | null
          made_admin_at: string | null
          made_admin_by: string | null
          marketing_consent: boolean | null
          newsletter_subscribed: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          phone_number: string | null
          phone_verified: boolean | null
          preferred_reading_time: string | null
          profession: string | null
          reading_goal_books_per_month: number | null
          reading_goal_pages_per_day: number | null
          referral_code: string | null
          referral_source: string | null
          referred_by: string | null
          registration_completed: boolean | null
          registration_completed_at: string | null
          registration_step: number | null
          role: string | null
          show_reading_activity: boolean | null
          show_statistics: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          target_exam: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
          website: string | null
          xp: number | null
        }
        Insert: {
          age?: number | null
          age_group?: string | null
          allow_friend_requests?: boolean | null
          avatar_custom_url?: string | null
          avatar_preset_id?: number | null
          avatar_type?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_jalali?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          email_verified?: boolean | null
          english_level?: string | null
          favorite_genres?: string[] | null
          field_of_study?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_banned?: boolean | null
          is_profile_public?: boolean | null
          language_preference?: string | null
          last_login_at?: string | null
          last_name?: string | null
          last_read_at?: string | null
          learning_goal?: string | null
          level?: string | null
          login_count?: number | null
          longest_streak?: number | null
          made_admin_at?: string | null
          made_admin_by?: string | null
          marketing_consent?: boolean | null
          newsletter_subscribed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_reading_time?: string | null
          profession?: string | null
          reading_goal_books_per_month?: number | null
          reading_goal_pages_per_day?: number | null
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          registration_completed?: boolean | null
          registration_completed_at?: string | null
          registration_step?: number | null
          role?: string | null
          show_reading_activity?: boolean | null
          show_statistics?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          target_exam?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          xp?: number | null
        }
        Update: {
          age?: number | null
          age_group?: string | null
          allow_friend_requests?: boolean | null
          avatar_custom_url?: string | null
          avatar_preset_id?: number | null
          avatar_type?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_jalali?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          email_verified?: boolean | null
          english_level?: string | null
          favorite_genres?: string[] | null
          field_of_study?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean | null
          is_profile_public?: boolean | null
          language_preference?: string | null
          last_login_at?: string | null
          last_name?: string | null
          last_read_at?: string | null
          learning_goal?: string | null
          level?: string | null
          login_count?: number | null
          longest_streak?: number | null
          made_admin_at?: string | null
          made_admin_by?: string | null
          marketing_consent?: boolean | null
          newsletter_subscribed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_reading_time?: string | null
          profession?: string | null
          reading_goal_books_per_month?: number | null
          reading_goal_pages_per_day?: number | null
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          registration_completed?: boolean | null
          registration_completed_at?: string | null
          registration_step?: number | null
          role?: string | null
          show_reading_activity?: boolean | null
          show_statistics?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          target_exam?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_made_admin_by_fkey"
            columns: ["made_admin_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          pages_read: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          pages_read?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          pages_read?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          user_id: string | null
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          user_id?: string | null
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          user_id?: string | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          book_id: string
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          last_error: string | null
          operation: string
          record_id: string
          sync_attempts: number | null
          synced: boolean | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          last_error?: string | null
          operation: string
          record_id: string
          sync_attempts?: number | null
          synced?: boolean | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          last_error?: string | null
          operation?: string
          record_id?: string
          sync_attempts?: number | null
          synced?: boolean | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_library: {
        Row: {
          book_id: string
          completed_at: string | null
          created_at: string | null
          current_page: number | null
          id: string
          last_read_at: string | null
          progress_percentage: number | null
          reading_time: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          book_id: string
          completed_at?: string | null
          created_at?: string | null
          current_page?: number | null
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_time?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          book_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_page?: number | null
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_time?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_library_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          book_id: string | null
          context: string | null
          correct_count: number | null
          created_at: string | null
          definition: string | null
          id: string
          mastery_level: number | null
          meaning: string | null
          next_review_at: string | null
          page_number: number | null
          review_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          word: string
        }
        Insert: {
          book_id?: string | null
          context?: string | null
          correct_count?: number | null
          created_at?: string | null
          definition?: string | null
          id?: string
          mastery_level?: number | null
          meaning?: string | null
          next_review_at?: string | null
          page_number?: number | null
          review_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          word: string
        }
        Update: {
          book_id?: string | null
          context?: string | null
          correct_count?: number | null
          created_at?: string | null
          definition?: string | null
          id?: string
          mastery_level?: number | null
          meaning?: string | null
          next_review_at?: string | null
          page_number?: number | null
          review_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age: { Args: { birth_date: string }; Returns: number }
      calculate_age_group: { Args: { birth_date: string }; Returns: string }
      check_expired_subscriptions: { Args: never; Returns: undefined }
      cleanup_old_sync_queue: { Args: never; Returns: undefined }
      generate_referral_code: { Args: { user_id: string }; Returns: string }
      generate_unique_username: { Args: { base_name: string }; Returns: string }
      get_avatar_url: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      is_valid_username: { Args: { username: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
