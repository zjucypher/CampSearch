/**
 * One-click pause / unsubscribe from email alert links.
 * Uses HMAC to verify the token without requiring the user to be logged in.
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://campsearch.vercel.app";

function makeToken(alertId: string): string {
  return createHmac("sha256", process.env.WORKER_SECRET ?? "secret")
    .update(alertId)
    .digest("hex")
    .slice(0, 24);
}

export function generateAlertToken(alertId: string): string {
  return makeToken(alertId);
}

export async function GET(req: NextRequest) {
  const alertId = req.nextUrl.searchParams.get("alert_id");
  const token = req.nextUrl.searchParams.get("token");
  const action = req.nextUrl.searchParams.get("action") ?? "pause";

  if (!alertId || !token || token !== makeToken(alertId)) {
    return new NextResponse("Invalid or expired link.", { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  if (action === "delete") {
    await db.from("alerts").delete().eq("id", alertId);
  } else {
    await db.from("alerts").update({ status: "paused" }).eq("id", alertId);
  }

  const dest = new URL("/dashboard", SITE_URL);
  dest.searchParams.set(action === "delete" ? "unsubscribed" : "paused", "1");
  return NextResponse.redirect(dest.toString());
}
