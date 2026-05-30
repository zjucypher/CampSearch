import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { PLAN_LIMITS } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*, campgrounds(id, name, park, photo_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(`alerts:${getClientIp(request)}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await getSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce plan limits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (supabase.from("profiles") as any).select("plan").eq("id", user.id).single();
  const plan = ((profileRow as { plan?: string } | null)?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from("alerts") as any).select("*", { count: "exact", head: true })
    .eq("user_id", user.id).eq("status", "monitoring");

  if ((count ?? 0) >= limits.maxAlerts) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows ${limits.maxAlerts} active alert${limits.maxAlerts === 1 ? "" : "s"}. Upgrade to add more.` },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Enforce minimum poll interval for plan
  const requestedInterval = body.poll_interval ?? 60;
  const safeInterval = Math.max(requestedInterval, limits.minInterval);

  const insert: Database["public"]["Tables"]["alerts"]["Insert"] = {
    user_id: user.id,
    campground_id: body.campground_id,
    arrive_date: body.arrive_date,
    depart_date: body.depart_date,
    flexibility: body.flexibility ?? "exact",
    site_mode: body.site_mode ?? "any",
    site_ids: body.site_ids ?? [],
    site_type: body.site_type ?? null,
    min_occupancy: body.min_occupancy ?? 1,
    amenity_filter: body.amenity_filter ?? [],
    adults: body.adults ?? 2,
    kids: body.kids ?? 0,
    vehicles: body.vehicles ?? 1,
    channel_email: body.channel_email ?? true,
    channel_sms: body.channel_sms ?? false,
    channel_push: body.channel_push ?? false,
    poll_interval: safeInterval as 30 | 60 | 300 | 1800,
    status: "monitoring",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("alerts").insert(insert as any).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data }, { status: 201 });
}
