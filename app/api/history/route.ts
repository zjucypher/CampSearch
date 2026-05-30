import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const alertId   = searchParams.get("alert_id");
  const eventType = searchParams.get("event_type");
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 200);

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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("alert_history")
    .select("*, alerts(campground_id, campgrounds(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (alertId)   query = query.eq("alert_id", alertId);
  if (eventType) query = query.eq("event_type", eventType);

  // Hide orphaned rows where alert_id is NULL but no campground_name was stamped
  // into detail (i.e. rows from alerts deleted before the stamp-on-delete fix).
  // Keep rows where alert_id IS NOT NULL, or detail->>'campground_name' is set.
  if (!alertId) {
    query = query.or("alert_id.not.is.null,detail->>campground_name.not.is.null");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data ?? [] });
}
