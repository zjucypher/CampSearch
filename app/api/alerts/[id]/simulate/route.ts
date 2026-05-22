import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

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

  // Verify alert belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alert } = await (supabase.from("alerts") as any)
    .select("id, campground_id, arrive_date, depart_date, hits")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  // Write a simulated hit to history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("alert_history") as any).insert({
    alert_id: id,
    user_id: user.id,
    event_type: "notified",
    site_id: 14,
    site_name: "Site 14",
    arrive_date: alert.arrive_date,
    depart_date: alert.depart_date,
    detail: { simulated: true, source: "manual" },
  });

  // Bump hits count on the alert directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("alerts") as any).update({
    hits: (alert as unknown as { hits: number }).hits + 1,
    status: "found",
    last_hit_at: new Date().toISOString(),
  }).eq("id", id);

  return NextResponse.json({ ok: true });
}
