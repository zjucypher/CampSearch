// Auto-generate this file with: npx supabase gen types typescript --linked > lib/supabase/types.ts
// Placeholder until the Supabase project is linked and migrations are run.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      campgrounds: {
        Row: {
          id: string;
          name: string;
          park: string;
          region: string;
          lat: number;
          lng: number;
          sites: number;
          elevation: string;
          tags: string[];
          description: string;
          cancellations_30d: number;
        };
        Insert: Omit<Database["public"]["Tables"]["campgrounds"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["campgrounds"]["Row"]>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          campground_id: string;
          arrive_date: string;
          depart_date: string;
          flexibility: string;
          site_mode: string;
          site_ids: string[];
          site_type: string | null;
          min_occupancy: number | null;
          adults: number;
          kids: number;
          vehicles: number;
          channels: Json;
          frequency: number;
          status: "monitoring" | "found" | "paused";
          hits: number;
          last_check: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["alerts"]["Row"],
          "id" | "created_at" | "hits" | "last_check"
        >;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Row"]>;
      };
      history: {
        Row: {
          id: string;
          alert_id: string;
          user_id: string;
          action: "Notified" | "Skipped" | "Continuing";
          detail: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["history"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["history"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
