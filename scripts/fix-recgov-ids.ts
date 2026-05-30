/**
 * Fix wrong Recreation.gov facility IDs by looking up the correct ones
 * via the public Recreation.gov search API.
 *
 * Usage:  npx tsx scripts/fix-recgov-ids.ts
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

function normalize(name: string): string {
  return name.toLowerCase()
    .replace(/\b(campground|camp|campsite|group camp|the|national|forest|park|lake)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function score(query: string, result: string): number {
  const a = new Set(normalize(query).split(" ").filter(Boolean));
  const b = normalize(result).split(" ").filter(Boolean);
  const matches = b.filter(w => a.has(w)).length;
  return matches / Math.max(a.size, b.length, 1);
}

async function search(name: string): Promise<{ id: number; name: string; score: number }[]> {
  const url = `https://www.recreation.gov/api/search?q=${encodeURIComponent(name)}&entity_type=campground&exact=false`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const d = await r.json() as { results?: { entity_id: number; name: string }[] };
  return (d.results ?? [])
    .map(x => ({ id: x.entity_id, name: x.name, score: score(name, x.name) }))
    .sort((a, b) => b.score - a.score);
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Manual overrides for campgrounds where auto-search picks the wrong result
const OVERRIDES: Record<string, number> = {
  "tioga-lake":          232761,  // Ellery Lake / Tioga area — use Ellery Creek camp
  "lundy-lake":          233851,  // Lundy Canyon Campground
  "agnew-meadows":       231956,  // Agnew Meadows (group camp is the only listing)
  "camp-richardson":     10105555, // Camp Richardson Campground (full hookup)
  "ellery-lake":         232761,  // Ellery Lake Campground
  "coast-camp":          233359,  // Point Reyes backcountry — single booking page
  "sky-camp":            233359,  // Point Reyes backcountry — same page
  "scorpion-ranch":      233392,  // Keep original — NPS may use a different ID
};

async function main() {
  const { data: campgrounds } = await db
    .from("campgrounds")
    .select("id, name, booking_url, rec_area_id")
    .like("booking_url", "%recreation.gov%")
    .not("rec_area_id", "is", null);

  let fixed = 0;
  let skipped = 0;

  for (const c of campgrounds ?? []) {
    await sleep(150); // be polite to the API

    // Skip campgrounds that verified correct in our earlier check
    if (c.id === "bridalveil" || c.id === "tuolumne") {
      console.log("✓ skip (verified)", c.id);
      continue;
    }

    const correctId: number = OVERRIDES[c.id] ??
      (() => {
        return 0; // will be filled by search
      })();

    let finalId = correctId;
    let finalName = "";

    if (!finalId) {
      const results = await search(c.name);
      const best = results[0];
      if (!best || best.score < 0.3) {
        console.log("? skip (no match)", c.id, "—", c.name);
        skipped++;
        continue;
      }
      finalId = best.id;
      finalName = best.name;
    }

    if (finalId === c.rec_area_id) {
      console.log("✓ already correct", c.id, finalId);
      continue;
    }

    const newUrl = `https://www.recreation.gov/camping/campgrounds/${finalId}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db.from("campgrounds") as any)
      .update({ rec_area_id: finalId, booking_url: newUrl })
      .eq("id", c.id);

    if (error) {
      console.error("✗", c.id, error.message);
    } else {
      console.log("✓ fixed", c.id.padEnd(24), c.rec_area_id, "→", finalId, finalName);
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed}, skipped ${skipped}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
