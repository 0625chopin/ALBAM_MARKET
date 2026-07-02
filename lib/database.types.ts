// Supabase 생성 타입 (자동 생성물 — 직접 수정 금지)
// 생성: Phase 4 T040-B, mcp__supabase__generate_typescript_types 결과를 그대로 기록.
// 갱신: ISSUE-015/016(products.description, ratings.comment, submit_rating p_comment),
//       ISSUE-004/006(penalties.penalty_type) 반영해 재생성.
//       카테고리 공통코드 이관(categories 테이블 제거, products.category text) 반영해 재생성.
//       ISSUE-018(스타터 groups/group_members + group 함수 4종 제거),
//       ISSUE-014(profiles.nickname NOT NULL) 반영해 재생성.
//       커스텀 OTP(email_verifications 테이블 + otp_find_user/cleanup_email_verifications 함수) 반영해 재생성.
//       닉네임 중복 체크(profiles.nickname lower() UNIQUE 인덱스 + nickname_exists 함수) 반영해 재생성.

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
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          product_id: string
          status: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          product_id: string
          status?: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          seller_id: string
          transaction_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          seller_id: string
          transaction_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          seller_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "chat_rooms_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "chat_rooms_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      code_groups: {
        Row: {
          created_at: string
          description: string | null
          group_key: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_key: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_key?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      codes: {
        Row: {
          code: string
          created_at: string
          group_key: string
          id: string
          is_active: boolean
          label: string
          num_value: number | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          group_key: string
          id?: string
          is_active?: boolean
          label: string
          num_value?: number | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          group_key?: string
          id?: string
          is_active?: boolean
          label?: string
          num_value?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "codes_group_key_fkey"
            columns: ["group_key"]
            isOneToOne: false
            referencedRelation: "code_groups"
            referencedColumns: ["group_key"]
          },
        ]
      }
      email_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          max_attempts: number
          purpose: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          max_attempts?: number
          purpose?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          created_at: string
          id: string
          penalty_type: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          penalty_type?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          penalty_type?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "penalties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          auction_ends_at: string
          buy_now_price: number | null
          category: string
          condition: string
          created_at: string
          current_price: number
          description: string | null
          id: string
          region: string
          seller_id: string
          start_price: number
          status: string
          title: string
          winner_id: string | null
        }
        Insert: {
          auction_ends_at?: string
          buy_now_price?: number | null
          category: string
          condition: string
          created_at?: string
          current_price: number
          description?: string | null
          id?: string
          region: string
          seller_id: string
          start_price: number
          status?: string
          title: string
          winner_id?: string | null
        }
        Update: {
          auction_ends_at?: string
          buy_now_price?: number | null
          category?: string
          condition?: string
          created_at?: string
          current_price?: number
          description?: string | null
          id?: string
          region?: string
          seller_id?: string
          start_price?: number
          status?: string
          title?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          buyer_level: number
          full_name: string | null
          id: string
          nickname: string
          region: string | null
          seller_level: number
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          buyer_level?: number
          full_name?: string | null
          id: string
          nickname: string
          region?: string | null
          seller_level?: number
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          buyer_level?: number
          full_name?: string | null
          id?: string
          nickname?: string
          region?: string | null
          seller_level?: number
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          ratee_id: string
          rater_id: string
          role: string
          score: number
          transaction_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id: string
          rater_id: string
          role: string
          score: number
          transaction_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          role?: string
          score?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ratings_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          buyer_id: string
          created_at: string
          final_price: number
          id: string
          product_id: string
          seller_id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          final_price: number
          id?: string
          product_id: string
          seller_id: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          final_price?: number
          id?: string
          product_id?: string
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profile_reputation: {
        Row: {
          buyer_avg_score: number | null
          buyer_completed_count: number | null
          buyer_level_calc: number | null
          buyer_rating_count: number | null
          profile_id: string | null
          seller_avg_score: number | null
          seller_completed_count: number | null
          seller_level_calc: number | null
          seller_rating_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _award_auction: {
        Args: {
          p_final_price: number
          p_product_id: string
          p_winner_id: string
        }
        Returns: string
      }
      abandon_won_auction: { Args: { p_product_id: string }; Returns: string }
      auto_complete_transactions: { Args: never; Returns: number }
      buy_now: { Args: { p_product_id: string }; Returns: string }
      calc_reputation_level: {
        Args: { avg_score: number; completed_count: number }
        Returns: number
      }
      cleanup_email_verifications: { Args: never; Returns: undefined }
      close_expired_auctions: { Args: never; Returns: number }
      complete_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      get_policy_int: { Args: { p_key: string }; Returns: number }
      nickname_exists: {
        Args: { p_exclude_id?: string; p_nickname: string }
        Returns: boolean
      }
      otp_find_user: {
        Args: { p_email: string }
        Returns: {
          email_confirmed: boolean
          id: string
        }[]
      }
      place_bid: {
        Args: { p_amount: number; p_product_id: string }
        Returns: number
      }
      submit_rating: {
        Args: { p_comment?: string; p_score: number; p_transaction_id: string }
        Returns: undefined
      }
      withdraw_product: { Args: { p_product_id: string }; Returns: undefined }
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
