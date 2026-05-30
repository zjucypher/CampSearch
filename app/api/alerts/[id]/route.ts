import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

async function getAuthedClient() {
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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["status", "channel_email", "channel_sms", "channel_push", "poll_interval",
    "arrive_date", "depart_date", "flexibility", "site_mode", "site_ids",
    "adults", "kids", "vehicles"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("alerts") as any)
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Record status transitions in activity history
  if (patch.status === "monitoring") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("alert_history") as any).insert({
      alert_id: id, user_id: user.id, event_type: "resumed",
    });
  } else if (patch.status === "paused") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("alert_history") as any).insert({
      alert_id: id, user_id: user.id, event_type: "paused",
    });
  }

  return NextResponse.json({ alert: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Record deletion before the row is removed (cascade will wipe history otherwise)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("alert_history") as any).insert({
    alert_id: id, user_id: user.id, event_type: "deleted",
  });

  const { error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
