/**
 * Batch-populate photo_url for all NPS campgrounds that lack one.
 *
 * Usage:
 *   npx tsx scripts/seed-photos.ts
 *
 * Reads .env.local automatically — no dotenv dependency needed.
 * Safe to re-run: only touches rows where photo_url IS NULL.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { fetchNpsPhotoUrl } from "../lib/nps";

// ── load .env.local without dotenv ─────────────────────────────────────────
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
  } catch {
    // .env.local not found — rely on env vars already set in shell
  }
}

loadEnv();

// ── main ───────────────────────────────────────────────────────────────────
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.NPS_API_KEY) {
    console.error("NPS_API_KEY is not set. Get a free key at https://www.nps.gov/subjects/developer/get-started.htm");
    process.exit(1);
  }

  const { data: campgrounds, error } = await db
    .from("campgrounds")
    .select("id, name, park, agency")
    .eq("agency", "NPS")
    .is("photo_url", null)
    .order("name");

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }

  const total = campgrounds?.length ?? 0;
  console.log(`Found ${total} NPS campgrounds without photos.\n`);

  let hits = 0;
  let misses = 0;

  for (const cg of campgrounds ?? []) {
    const url = await fetchNpsPhotoUrl(cg.name, cg.park);

    if (url) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from("campgrounds") as any).update({ photo_url: url }).eq("id", cg.id);
      console.log(`  ✓  ${cg.name}`);
      hits++;
    } else {
      console.log(`  –  ${cg.name} (no match)`);
      misses++;
    }

    await sleep(200); // stay within NPS API rate limit
  }

  console.log(`\nDone. ${hits} updated, ${misses} not found.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
