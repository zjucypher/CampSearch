import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { sendHitEmail } from "@/lib/email/send";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  // Service-role client for admin lookups (email, profile)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch alert + campground
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alert } = await (supabase.from("alerts") as any)
    .select("id, campground_id, arrive_date, depart_date, hits, campgrounds(name, park, booking_url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const campground = alert.campgrounds ?? {};
  const siteName = "Site 14";
  const bookingUrl = campground.booking_url ?? "https://www.recreation.gov";

  // Write simulated hit to history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("alert_history") as any).insert({
    alert_id: id,
    user_id: user.id,
    event_type: "notified",
    site_id: 14,
    site_name: siteName,
    arrive_date: alert.arrive_date,
    depart_date: alert.depart_date,
    detail: { simulated: true, source: "manual", booking_url: bookingUrl },
  });

  // Bump hits count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("alerts") as any).update({
    hits: (alert.hits ?? 0) + 1,
    status: "found",
    last_hit_at: new Date().toISOString(),
  }).eq("id", id);

  // Send email notification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from("profiles") as any)
    .select("full_name, notify_email")
    .eq("id", user.id)
    .single();

  if (profile?.notify_email !== false) {
    const { data: adminUser } = await admin.auth.admin.getUserById(user.id);
    const email = adminUser.user?.email;
    if (email) {
      await sendHitEmail({
        to: email,
        userName: profile?.full_name ?? "Camper",
        campgroundName: campground.name ?? "Your campground",
        park: campground.park ?? "",
        siteName,
        arriveDate: alert.arrive_date,
        departDate: alert.depart_date,
        bookingUrl,
      }).catch((err: unknown) => console.error("[simulate] email error:", err));
    }
  }

  return NextResponse.json({ ok: true });
}
