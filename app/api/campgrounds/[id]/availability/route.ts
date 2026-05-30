import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CampsiteAvailability = {
  site: string;
  loop: string;
  type: string;
  avail: Record<string, boolean>; // "YYYY-MM-DD" → true=Available
};

// Recreation.gov blocks Vercel's Lambda (AWS IP range) with HTTP 400.
// Requests are routed through the Railway worker which uses Python requests
// from a non-AWS IP. RAILWAY_PROXY_URL points to the Railway service's
// public domain; PROXY_SECRET authenticates each request.
const PROXY_URL = (process.env.RAILWAY_PROXY_URL ?? "").replace(/\/$/, "");
const PROXY_SECRET = process.env.PROXY_SECRET ?? "";

async function proxyGet(path: "availability" | "search", params: Record<string, string>): Promise<unknown> {
  if (!PROXY_URL) {
    console.error("[availability] RAILWAY_PROXY_URL is not configured");
    return null;
  }
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${PROXY_URL}/${path}?${qs}`, {
      headers: { "X-Proxy-Secret": PROXY_SECRET },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[availability] proxy ${path} returned HTTP ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`[availability] proxy ${path} fetch error:`, err);
    return null;
  }
}

function serviceDb() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get("start") ?? new Date().toISOString().split("T")[0];
  const days = Math.min(parseInt(searchParams.get("days") ?? "14"), 180);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campground } = await (serviceDb().from("campgrounds") as any)
    .select("id, name, agency, rec_area_id")
    .eq("id", id)
    .single() as { data: { id: string; name: string; agency: string; rec_area_id: number | null } | null };

  if (!campground) {
    return NextResponse.json({ error: "Campground not found" }, { status: 404 });
  }

  if (campground.agency === "CA-SP") {
    return NextResponse.json({ campsites: {}, unsupported: true });
  }

  let facilityId = campground.rec_area_id ? String(campground.rec_area_id) : "";

  if (!facilityId) {
    const data = await proxyGet("search", { q: campground.name }) as { results?: Array<{ entity_id: string }> } | null;
    facilityId = data?.results?.[0]?.entity_id ? String(data.results[0].entity_id) : "";
    if (facilityId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceDb().from("campgrounds") as any)
        .update({ rec_area_id: parseInt(facilityId) })
        .eq("id", id);
    }
  }

  if (!facilityId) {
    return NextResponse.json({ campsites: {} });
  }

  // Determine which calendar months to cover
  const startDate = new Date(startStr + "T12:00:00Z");
  const endDate   = new Date(startDate.getTime() + days * 86_400_000);

  const months = new Set<string>();
  const cursor = new Date(startDate);
  cursor.setUTCDate(1);
  while (cursor <= endDate) {
    months.add(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-01`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const campsites: Record<string, CampsiteAvailability> = {};

  await Promise.all([...months].map(async (month) => {
    const data = await proxyGet("availability", { facility_id: facilityId, month }) as {
      campsites?: Record<string, Record<string, unknown>>;
    } | null;
    if (!data?.campsites) return;

    for (const [cid, info] of Object.entries(data.campsites)) {
      if (!campsites[cid]) {
        campsites[cid] = {
          site: (info.site as string) || cid,
          loop: (info.loop as string) || "",
          type: (info.campsite_type as string) || "",
          avail: {},
        };
      }
      for (const [dateKey, status] of Object.entries(info.availabilities as Record<string, string> ?? {})) {
        campsites[cid].avail[dateKey.split("T")[0]] = status === "Available";
      }
    }
  }));

  return NextResponse.json({ campsites });
}
