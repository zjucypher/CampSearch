/**
 * Fix booking_url for CA State Park campgrounds.
 * ReserveCalifornia's old hash-based URLs (#!park/NNN) no longer work.
 * Replace them with a ReserveCalifornia search URL keyed on the campground name.
 *
 * Usage:  npx tsx scripts/fix-casp-urls.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file = ".env.local") {
  try {
    const text = readFileSync(resolve(process.cwd(), file), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch { /* fall through */ }
}

loadEnv();

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function rcSearchUrl(campgroundName: string): string {
  const q = encodeURIComponent(campgroundName);
  return `https://www.reservecalifornia.com/CaliforniaWebHome/Facilities/AdvanceSearch.aspx?txtSearchField=${q}`;
}

async function main() {
  // Find all CA-SP campgrounds whose booking_url looks broken or missing
  const { data: campgrounds, error } = await db
    .from("campgrounds")
    .select("id, name, booking_url")
    .eq("agency", "CA-SP");

  if (error) { console.error(error.message); process.exit(1); }

  let updated = 0;
  for (const c of campgrounds ?? []) {
    const url = c.booking_url ?? "";
    const needsFix =
      !url ||
      url.includes("recreation.gov") ||           // wrong platform
      url.includes("#!park/") ||                   // old hash format
      url.includes("pagenotfound");                // known-broken

    if (!needsFix) continue;

    const newUrl = rcSearchUrl(c.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e } = await (db.from("campgrounds") as any)
      .update({ booking_url: newUrl, rec_area_id: null })
      .eq("id", c.id);

    if (e) {
      console.error(`  ✗ ${c.id}: ${e.message}`);
    } else {
      console.log(`  ✓ ${c.name}\n    → ${newUrl}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} CA-SP record(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
