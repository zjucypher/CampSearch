// Run `npx supabase gen types typescript --linked > lib/supabase/types.ts` after linking.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      campgrounds: {
        Row: {
          id: string;
          name: string;
          park: string;
          state: string;
          rec_area_id: number | null;
          agency: string;
          lat: number | null;
          lng: number | null;
          site_count: number;
          amenities: string[];
          photo_url: string | null;
          description: string | null;
          booking_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campgrounds"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campgrounds"]["Insert"]>;
      };

      alerts: {
        Row: {
          id: string;
          user_id: string;
          campground_id: string;
          arrive_date: string;
          depart_date: string;
          flexibility: "exact" | "3d" | "week" | "wknd";
          site_mode: "specific" | "any";
          site_ids: string[];
          site_type: string | null;
          min_occupancy: number;
          amenity_filter: string[];
          adults: number;
          kids: number;
          vehicles: number;
          channel_email: boolean;
          channel_sms: boolean;
          channel_push: boolean;
          poll_interval: 30 | 60 | 300 | 1800;
          status: "monitoring" | "paused" | "found" | "expired";
          hits: number;
          last_checked_at: string | null;
          last_hit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["alerts"]["Row"],
          "id" | "created_at" | "updated_at" | "hits" | "last_checked_at" | "last_hit_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          hits?: number;
          last_checked_at?: string | null;
          last_hit_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };

      alert_history: {
        Row: {
          id: string;
          alert_id: string | null;
          user_id: string;
          event_type: "check" | "hit" | "notified" | "paused" | "resumed" | "deleted";
          site_id: number | null;
          site_name: string | null;
          arrive_date: string | null;
          depart_date: string | null;
          detail: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alert_history"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alert_history"]["Insert"]>;
      };

      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          timezone: string;
          plan: "free" | "pro" | "ranger";
          default_adults: number;
          default_kids: number;
          default_flexibility: string;
          default_poll: number;
          default_channels: string[];
          notify_email: boolean;
          notify_sms: boolean;
          notify_push: boolean;
          quiet_start: string | null;
          quiet_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
