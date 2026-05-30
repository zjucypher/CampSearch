import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CampsiteAvailability = {
  site: string;
  loop: string;
  type: string;
  avail: Record<string, boolean>; // "YYYY-MM-DD" → true=Available
};

// Recreation.gov blocks Node.js's TLS fingerprint (undici/OpenSSL) with HTTP 400.
// Python's requests library uses a different TLS stack that rec.gov accepts —
// the same stack camply uses. We spawn a tiny Python subprocess to do the fetch.
const PYTHON_FETCHER = `
import sys, json, requests

facility_id = sys.argv[1]
months      = sys.argv[2].split(",")
result      = {}

for month in months:
    url = f"https://www.recreation.gov/api/camps/availability/campground/{facility_id}/month"
    try:
        r = requests.get(
            url,
            params={"start_date": f"{month}T00:00:00.000Z"},
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            timeout=15,
        )
        if not r.ok:
            continue
        for cid, info in r.json().get("campsites", {}).items():
            if cid not in result:
                result[cid] = {
                    "site": info.get("site") or cid,
                    "loop": info.get("loop") or "",
                    "type": info.get("campsite_type") or "",
                    "avail": {},
                }
            for date_key, status in (info.get("availabilities") or {}).items():
                result[cid]["avail"][date_key.split("T")[0]] = (status == "Available")
    except Exception as e:
        sys.stderr.write(f"month {month}: {e}\\n")

json.dump(result, sys.stdout)
`.trim();

// Search Recreation.gov by campground name to find its facility ID
const PYTHON_LOOKUP = `
import sys, json, re, requests

name = sys.argv[1]
r = requests.get(
    "https://www.recreation.gov/api/search",
    params={"q": name, "entity_type": "campground", "exact": "false"},
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    timeout=10,
)
results = r.json().get("results", []) if r.ok else []
# Return first result's entity_id (facility ID)
print(results[0]["entity_id"] if results else "")
`.trim();

function spawnPython(args: string[], script: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("python3", ["-c", script, ...args]);
    let out = "";
    proc.stdout.on("data", (chunk: Buffer) => { out += chunk.toString(); });
    proc.on("close", () => resolve(out.trim()));
    proc.on("error", () => resolve(""));
    const timer = setTimeout(() => { proc.kill(); resolve(""); }, 20_000);
    proc.on("close", () => clearTimeout(timer));
  });
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

  // Look up campground to determine provider and facility ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campground } = await (serviceDb().from("campgrounds") as any)
    .select("id, name, agency, rec_area_id")
    .eq("id", id)
    .single() as { data: { id: string; name: string; agency: string; rec_area_id: number | null } | null };

  if (!campground) {
    return NextResponse.json({ error: "Campground not found" }, { status: 404 });
  }

  // CA state parks use ReserveCalifornia — not supported here
  if (campground.agency === "CA-SP") {
    return NextResponse.json({ campsites: {}, unsupported: true });
  }

  // For NPS / USFS campgrounds, resolve facility ID:
  // use the stored rec_area_id or fall back to a live search
  let facilityId = campground.rec_area_id ? String(campground.rec_area_id) : "";

  if (!facilityId) {
    facilityId = await spawnPython([campground.name], PYTHON_LOOKUP);
    if (facilityId) {
      // Persist the discovered ID so subsequent requests skip the lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceDb().from("campgrounds") as any)
        .update({ rec_area_id: parseInt(facilityId) })
        .eq("id", id);
    }
  }

  if (!facilityId) {
    return NextResponse.json({ campsites: {} });
  }

  // Determine which calendar months to fetch
  const startDate = new Date(startStr + "T12:00:00Z");
  const endDate   = new Date(startDate.getTime() + days * 86_400_000);

  const months = new Set<string>();
  const cursor = new Date(startDate);
  cursor.setUTCDate(1);
  while (cursor <= endDate) {
    months.add(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-01`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const raw = await spawnPython([facilityId, [...months].join(",")], PYTHON_FETCHER);
  let campsites: Record<string, CampsiteAvailability> = {};
  try { campsites = JSON.parse(raw); } catch { /* leave empty */ }

  return NextResponse.json({ campsites });
}
