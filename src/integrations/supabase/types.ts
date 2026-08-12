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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_series: {
        Row: {
          active: boolean
          author_id: string
          created_at: string
          description: string
          id: string
          item_ids: Json
          name: string
          tiers: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          created_at?: string
          description?: string
          id?: string
          item_ids?: Json
          name: string
          tiers?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          item_ids?: Json
          name?: string
          tiers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      custom_bundles: {
        Row: {
          active: boolean
          author_id: string
          contents: Json
          created_at: string
          description: string
          emoji: string
          ends_at: string | null
          id: string
          once_per_player: boolean
          price: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          contents?: Json
          created_at?: string
          description?: string
          emoji?: string
          ends_at?: string | null
          id?: string
          once_per_player?: boolean
          price?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          contents?: Json
          created_at?: string
          description?: string
          emoji?: string
          ends_at?: string | null
          id?: string
          once_per_player?: boolean
          price?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_collectibles: {
        Row: {
          active: boolean
          author_id: string
          created_at: string
          description: string
          effect: Json
          emoji: string
          id: string
          item_key: string
          name: string
          rarity_key: string
          series_key: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          created_at?: string
          description?: string
          effect?: Json
          emoji?: string
          id?: string
          item_key: string
          name: string
          rarity_key?: string
          series_key?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          created_at?: string
          description?: string
          effect?: Json
          emoji?: string
          id?: string
          item_key?: string
          name?: string
          rarity_key?: string
          series_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_missions: {
        Row: {
          active: boolean
          author_id: string
          created_at: string
          description: string
          expires_at: string | null
          goal: Json
          id: string
          reward: Json
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          created_at?: string
          description?: string
          expires_at?: string | null
          goal?: Json
          id?: string
          reward?: Json
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          goal?: Json
          id?: string
          reward?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_rarities: {
        Row: {
          active: boolean
          author_id: string
          color: string
          cooldown_sec: number
          created_at: string
          emoji: string
          id: string
          key: string
          label: string
          ladder_rank: number
          pack_weights: Json
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          color?: string
          cooldown_sec?: number
          created_at?: string
          emoji?: string
          id?: string
          key: string
          label: string
          ladder_rank?: number
          pack_weights?: Json
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          color?: string
          cooldown_sec?: number
          created_at?: string
          emoji?: string
          id?: string
          key?: string
          label?: string
          ladder_rank?: number
          pack_weights?: Json
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      market_cars: {
        Row: {
          body_type: string
          car_json: Json
          car_name: string
          id: string
          listed_at: string
          price: number
          primary_color: string
          seller_nick: string
          time_0_100: number
          times_purchased: number
          top_speed: number
        }
        Insert: {
          body_type: string
          car_json: Json
          car_name: string
          id?: string
          listed_at?: string
          price: number
          primary_color: string
          seller_nick: string
          time_0_100: number
          times_purchased?: number
          top_speed: number
        }
        Update: {
          body_type?: string
          car_json?: Json
          car_name?: string
          id?: string
          listed_at?: string
          price?: number
          primary_color?: string
          seller_nick?: string
          time_0_100?: number
          times_purchased?: number
          top_speed?: number
        }
        Relationships: []
      }
      mods: {
        Row: {
          author_nick: string
          description: string
          downloads: number
          id: string
          kind: string
          name: string
          payload: Json
          uploaded_at: string
        }
        Insert: {
          author_nick: string
          description?: string
          downloads?: number
          id?: string
          kind: string
          name: string
          payload: Json
          uploaded_at?: string
        }
        Update: {
          author_nick?: string
          description?: string
          downloads?: number
          id?: string
          kind?: string
          name?: string
          payload?: Json
          uploaded_at?: string
        }
        Relationships: []
      }
      save_states: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_offers: {
        Row: {
          created_at: string
          give: Json
          id: string
          note: string
          owner_id: string
          owner_nick: string
          payout: Json
          payout_claimed: boolean
          status: string
          taken_by: string | null
          updated_at: string
          want: Json
        }
        Insert: {
          created_at?: string
          give: Json
          id?: string
          note?: string
          owner_id: string
          owner_nick: string
          payout?: Json
          payout_claimed?: boolean
          status?: string
          taken_by?: string | null
          updated_at?: string
          want: Json
        }
        Update: {
          created_at?: string
          give?: Json
          id?: string
          note?: string
          owner_id?: string
          owner_nick?: string
          payout?: Json
          payout_claimed?: boolean
          status?: string
          taken_by?: string | null
          updated_at?: string
          want?: Json
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          item_ids: Json
          nick: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_ids?: Json
          nick?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_ids?: Json
          nick?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_market_purchase: { Args: { _id: string }; Returns: undefined }
      increment_mod_download: { Args: { _id: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
