import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const park = searchParams.get("park") ?? "";
  const agency = searchParams.get("agency") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 500);

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const amenity = searchParams.get("amenity") ?? "";

  let query = supabase
    .from("campgrounds")
    .select("id, name, park, agency, lat, lng, site_count, amenities, photo_url")
    .eq("state", "CA")
    .limit(limit);

  if (q) {
    query = query.or(`name.ilike.%${q}%,park.ilike.%${q}%`);
  }
  if (park) {
    query = query.ilike("park", `%${park}%`);
  }
  if (agency) {
    query = query.eq("agency", agency);
  }
  if (amenity) {
    query = query.contains("amenities", [amenity]);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campgrounds: data ?? [] });
}
