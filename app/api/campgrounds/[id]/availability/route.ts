import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const runtime = "edge";

export type CampsiteAvailability = {
  site: string;
  loop: string;
  type: string;
  avail: Record<string, boolean>; // "YYYY-MM-DD" → true=Available
};

const REC_GOV = "https://www.recreation.gov";
const REC_GOV_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function recGovGet(path: string, params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${REC_GOV}${path}?${qs}`, {
      headers: REC_GOV_HEADERS,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[availability] Recreation.gov ${path} returned HTTP ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`[availability] Recreation.gov fetch error:`, err);
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
    const data = await recGovGet("/api/search", { q: campground.name, entity_type: "campground", exact: "false" }) as { results?: Array<{ entity_id: string }> } | null;
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
    const data = await recGovGet(
      `/api/camps/availability/campground/${facilityId}/month`,
      { start_date: `${month}T00:00:00.000Z` }
    ) as { campsites?: Record<string, Record<string, unknown>> } | null;
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
