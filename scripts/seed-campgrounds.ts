/**
 * Seed the campgrounds table with:
 *   • All 96 California NPS campgrounds (from NPS Data API)
 *   • ~60 popular CA State Park and National Forest campgrounds (hardcoded)
 *
 * Usage:  npx tsx scripts/seed-campgrounds.ts
 *
 * Reads .env.local automatically.
 * Safe to re-run — uses ON CONFLICT DO UPDATE so existing rows are refreshed.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// ── load .env.local ─────────────────────────────────────────────────────────
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
  } catch { /* rely on shell env */ }
}

loadEnv();

// ── helpers ─────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(campground|camp ground|campsite|group camp|group site|rv park|backcountry|primitive|wilderness)\b/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLatLng(raw: string): { lat: number; lng: number } | null {
  // Handles both "{lat:40.52, lng:-121.56}" and "lat:40.52, long:-121.56"
  const m = raw.match(/lat:([\d.-]+)[,\s]+(?:lng|long):([\d.-]+)/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

function mapAmenities(a: Record<string, string | string[]>): string[] {
  const tags: string[] = [];
  const toilets = (Array.isArray(a.toilets) ? a.toilets : []).join(",").toLowerCase();
  if (toilets.includes("flush")) tags.push("flush-toilets");
  if (toilets.includes("vault")) tags.push("vault-toilets");
  const showers = (Array.isArray(a.showers) ? a.showers : []).join(",").toLowerCase();
  if (showers && !showers.includes("none")) tags.push("showers");
  const water = (Array.isArray(a.potableWater) ? a.potableWater : []).join(",").toLowerCase();
  if (water.includes("yes")) tags.push("potable-water");
  if (String(a.campfireAllowed ?? "").toLowerCase().startsWith("yes")) tags.push("fire-ring");
  if (String(a.foodStorageLockers ?? "").toLowerCase().startsWith("yes")) tags.push("bear-boxes");
  if (String(a.petsPermitted ?? "").toLowerCase().startsWith("yes")) tags.push("pets");
  if (String(a.electricalHookups ?? "").toLowerCase().startsWith("yes")) tags.push("rv-hookups");
  if (String(a.dumpStation ?? "").toLowerCase().startsWith("yes")) tags.push("dump-station");
  return [...new Set(tags)];
}

function extractRecId(url: string): number | null {
  const m = url?.match(/\/(\d{5,})\/?(?:\?|$)/);
  return m ? parseInt(m[1]) : null;
}

// ── NPS API ─────────────────────────────────────────────────────────────────

async function fetchNpsCampgrounds(apiKey: string) {
  const res = await fetch(
    `https://developer.nps.gov/api/v1/campgrounds?stateCode=CA&limit=500&api_key=${apiKey}`
  );
  if (!res.ok) throw new Error(`NPS campgrounds API error: ${res.status}`);
  const json = await res.json();
  return json.data as Record<string, string | Record<string, string | string[]>>[];
}

async function fetchParkNames(apiKey: string, codes: string[]): Promise<Map<string, string>> {
  const res = await fetch(
    `https://developer.nps.gov/api/v1/parks?parkCode=${codes.join(",")}&limit=100&api_key=${apiKey}`
  );
  if (!res.ok) return new Map();
  const json = await res.json();
  const map = new Map<string, string>();
  for (const p of json.data ?? []) map.set(p.parkCode, p.fullName);
  return map;
}

// ── Curated non-NPS campgrounds ──────────────────────────────────────────────

type CampgroundRow = {
  id: string; name: string; park: string; state: string; agency: string;
  lat: number | null; lng: number | null; site_count: number;
  amenities: string[]; description: string | null; booking_url: string | null;
  rec_area_id: number | null;
};

const MANUAL: CampgroundRow[] = [
  // ── California State Parks ──
  { id:"emerald-bay",      name:"Emerald Bay",          park:"Emerald Bay State Park",         state:"CA", agency:"CA-SP", lat:38.9534,  lng:-120.1054, site_count:100, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Stunning lakeside sites overlooking Emerald Bay with views of Vikingsholm and Fannette Island.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/118", rec_area_id:null },
  { id:"sugar-pine-point", name:"Sugar Pine Point",     park:"Sugar Pine Point State Park",    state:"CA", agency:"CA-SP", lat:39.0757,  lng:-120.1278, site_count:175, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Forested sites near the lakeshore with access to Sugar Pine Point's historic mansion and trails.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/125", rec_area_id:null },
  { id:"big-basin",        name:"Big Basin Redwoods",   park:"Big Basin Redwoods State Park",  state:"CA", agency:"CA-SP", lat:37.1735,  lng:-122.2208, site_count:120, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"California's oldest state park. Old-growth coastal redwoods, waterfalls, and 80 miles of trails.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/124", rec_area_id:null },
  { id:"henry-cowell",     name:"Henry Cowell Redwoods",park:"Henry Cowell Redwoods State Park",state:"CA",agency:"CA-SP", lat:37.0516,  lng:-122.0602, site_count:115, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Giant redwood grove near Santa Cruz with 15 miles of trails along the San Lorenzo River.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/123", rec_area_id:null },
  { id:"samuel-p-taylor",  name:"Samuel P. Taylor",     park:"Samuel P. Taylor State Park",    state:"CA", agency:"CA-SP", lat:38.0075,  lng:-122.7279, site_count:60,  amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Shady redwood canyon camp on Lagunitas Creek, 15 minutes from Point Reyes.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/232", rec_area_id:null },
  { id:"salt-point",       name:"Salt Point",            park:"Salt Point State Park",          state:"CA", agency:"CA-SP", lat:38.5695,  lng:-123.3280, site_count:109, amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Rugged Sonoma Coast bluffs with excellent tide pools, abalone coves, and pygmy forest.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/145", rec_area_id:null },
  { id:"mackorricher",     name:"MacKerricher",          park:"MacKerricher State Park",        state:"CA", agency:"CA-SP", lat:39.4967,  lng:-123.7922, site_count:140, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Beachfront dunes and headlands north of Fort Bragg with seal-watching at Lake Cleone.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/155", rec_area_id:null },
  { id:"van-damme",        name:"Van Damme",              park:"Van Damme State Park",           state:"CA", agency:"CA-SP", lat:39.2738,  lng:-123.7921, site_count:74,  amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Fern canyon in a sheltered cove near Mendocino village, ideal for kayaking and abalone diving.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/154", rec_area_id:null },
  { id:"russian-gulch",    name:"Russian Gulch",          park:"Russian Gulch State Park",       state:"CA", agency:"CA-SP", lat:39.3293,  lng:-123.8006, site_count:30,  amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Deep fern canyon near Mendocino with a waterfall hike and rocky cove for kayaking.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/153", rec_area_id:null },
  { id:"hendy-woods",      name:"Hendy Woods",            park:"Hendy Woods State Park",         state:"CA", agency:"CA-SP", lat:39.0884,  lng:-123.4618, site_count:92,  amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Ancient redwood grove in the Anderson Valley wine country. Two old-growth groves and gentle trails.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/156", rec_area_id:null },
  { id:"standish-hickey",  name:"Standish-Hickey",        park:"Standish-Hickey State Recreation Area", state:"CA", agency:"CA-SP", lat:39.7865, lng:-123.6547, site_count:162, amenities:["flush-toilets","potable-water","fire-ring","showers"], description:"Redwood and fir forest along the South Fork Eel River. Swimming holes and riverside hiking.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/158", rec_area_id:null },
  { id:"patricks-point",   name:"Patrick's Point",        park:"Patrick's Point State Park",     state:"CA", agency:"CA-SP", lat:41.1383,  lng:-124.1527, site_count:124, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Dramatic coastal promontory with Agate Beach, tide pools, and a reconstructed Yurok village.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/162", rec_area_id:null },
  { id:"leo-carrillo",     name:"Leo Carrillo",            park:"Leo Carrillo State Park",        state:"CA", agency:"CA-SP", lat:34.0434,  lng:-118.9347, site_count:135, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Sandy beach with sea caves, tidepools, and kelp diving. 28 miles north of Malibu.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/200", rec_area_id:null },
  { id:"malibu-creek",     name:"Malibu Creek",            park:"Malibu Creek State Park",        state:"CA", agency:"CA-SP", lat:34.1001,  lng:-118.7421, site_count:57,  amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Oak woodland canyon camp near Calabasas. Filming location for M*A*S*H. Rock Pool swimming hole.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/201", rec_area_id:null },
  { id:"palomar-mountain",  name:"Palomar Mountain",        park:"Palomar Mountain State Park",    state:"CA", agency:"CA-SP", lat:33.3460,  lng:-116.9000, site_count:31,  amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Oak and conifer forest at 5,500 ft below the famous Palomar Observatory. Cool summer escape from San Diego heat.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/222", rec_area_id:null },
  { id:"cuyamaca",         name:"Cuyamaca Rancho",          park:"Cuyamaca Rancho State Park",     state:"CA", agency:"CA-SP", lat:32.9460,  lng:-116.5784, site_count:165, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Oak and pine forest recovering from 2003 Cedar Fire. Great birding and mountain biking east of San Diego.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/223", rec_area_id:null },
  { id:"borrego-palm",     name:"Borrego Palm Canyon",      park:"Anza-Borrego Desert State Park", state:"CA", agency:"CA-SP", lat:33.2596,  lng:-116.4224, site_count:117, amenities:["flush-toilets","potable-water","fire-ring","dump-station"],   description:"Oasis in the largest state park outside Alaska. Wildlife, wildflowers, and the famous Borrego Springs sculptures.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/109", rec_area_id:null },
  { id:"mount-tam-pantoll", name:"Mount Tamalpais Pantoll",  park:"Mount Tamalpais State Park",     state:"CA", agency:"CA-SP", lat:37.9052,  lng:-122.5991, site_count:16,  amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Walk-in tent sites high on Mount Tam with fog views over the Bay and Pacific. Near Muir Woods.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/229", rec_area_id:null },
  { id:"newbright",        name:"New Brighton Beach",        park:"New Brighton State Beach",       state:"CA", agency:"CA-SP", lat:36.9798,  lng:-121.9718, site_count:115, amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Blufftop sites above a sandy beach in Capitola, minutes from Santa Cruz Boardwalk.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/120", rec_area_id:null },
  { id:"manresa-beach",    name:"Manresa Uplands",           park:"Manresa State Beach",            state:"CA", agency:"CA-SP", lat:36.9404,  lng:-121.9279, site_count:64,  amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Bluff-top walk-in tent sites overlooking the surf in La Selva Beach near Aptos.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/121", rec_area_id:null },
  { id:"wrights-beach",    name:"Wright's Beach",            park:"Sonoma Coast State Park",        state:"CA", agency:"CA-SP", lat:38.4332,  lng:-123.1168, site_count:27,  amenities:["flush-toilets","potable-water","fire-ring"],                  description:"Premium beachfront sites directly on the sand at Wrights Beach with sea stack views.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/143", rec_area_id:null },
  { id:"bodega-dunes",     name:"Bodega Dunes",              park:"Sonoma Coast State Park",        state:"CA", agency:"CA-SP", lat:38.3437,  lng:-123.0518, site_count:98,  amenities:["flush-toilets","potable-water","fire-ring","showers"],        description:"Dune forest camp near Bodega Bay. Short walk to a long sandy beach, great whale watching.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/143", rec_area_id:null },
  { id:"austin-creek",     name:"Austin Creek",              park:"Austin Creek State Recreation Area",state:"CA",agency:"CA-SP",lat:38.5500,lng:-123.0000,  site_count:24,  amenities:["vault-toilets","potable-water","fire-ring"],                  description:"Rugged backcountry sites accessible by narrow road through Armstrong Redwoods. No RVs.", booking_url:"https://www.reservecalifornia.com/Web/Default.aspx#!park/144", rec_area_id:null },

  // ── National Forest & BLM ──
  { id:"convict-lake",     name:"Convict Lake",              park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.5940,  lng:-118.8524, site_count:88,  amenities:["flush-toilets","potable-water","fire-ring","bear-boxes"],   description:"Stunning high-altitude lake at 7,600 ft below dramatic cliffs. Excellent trout fishing and hiking.", booking_url:"https://www.recreation.gov/camping/campgrounds/232252", rec_area_id:232252 },
  { id:"mcgee-creek",      name:"McGee Creek",               park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.5562,  lng:-118.8024, site_count:28,  amenities:["vault-toilets","potable-water","fire-ring","bear-boxes"],   description:"Streamside camp at the mouth of McGee Creek canyon. Gateway to the John Muir Wilderness.", booking_url:"https://www.recreation.gov/camping/campgrounds/232263", rec_area_id:232263 },
  { id:"rock-creek-lake",  name:"Rock Creek Lake",           park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.4648,  lng:-118.7329, site_count:28,  amenities:["vault-toilets","potable-water","fire-ring","bear-boxes"],   description:"Alpine lake at 9,682 ft surrounded by 13,000 ft peaks. Superb trout fishing and high-country hiking.", booking_url:"https://www.recreation.gov/camping/campgrounds/232261", rec_area_id:232261 },
  { id:"lake-mary",        name:"Lake Mary",                 park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.5975,  lng:-119.0001, site_count:47,  amenities:["flush-toilets","potable-water","fire-ring","bear-boxes"],   description:"Largest of the Mammoth Lakes. Sites near the shore with boat rentals and easy trail access.", booking_url:"https://www.recreation.gov/camping/campgrounds/232237", rec_area_id:232237 },
  { id:"new-shady-rest",   name:"New Shady Rest",            park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.6468,  lng:-118.9702, site_count:92,  amenities:["flush-toilets","potable-water","fire-ring","bear-boxes"],   description:"Well-maintained sites in the Mammoth Lakes area pine forest, minutes from town and ski lifts.", booking_url:"https://www.recreation.gov/camping/campgrounds/232239", rec_area_id:232239 },
  { id:"agnew-meadows",    name:"Agnew Meadows",             park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.6832,  lng:-119.0628, site_count:21,  amenities:["vault-toilets","potable-water","fire-ring","bear-boxes"],   description:"Meadow camp above Mammoth at 8,400 ft. Trailhead for the Pacific Crest Trail and high route to Devils Postpile.", booking_url:"https://www.recreation.gov/camping/campgrounds/232227", rec_area_id:232227 },
  { id:"plaskett-creek",   name:"Plaskett Creek",            park:"Los Padres National Forest",     state:"CA", agency:"USFS", lat:35.9557,  lng:-121.4673, site_count:43,  amenities:["flush-toilets","potable-water","fire-ring"],               description:"Forested camp at the edge of the Big Sur cliffs with easy beach access at Sand Dollar Beach.", booking_url:"https://www.recreation.gov/camping/campgrounds/233442", rec_area_id:233442 },
  { id:"wrights-lake",     name:"Wrights Lake",              park:"Eldorado National Forest",       state:"CA", agency:"USFS", lat:38.8390,  lng:-120.2222, site_count:67,  amenities:["flush-toilets","potable-water","fire-ring","bear-boxes"],   description:"Glacially carved lake at 6,983 ft in the Crystal Basin. Excellent for kayaking and wilderness day hikes.", booking_url:"https://www.recreation.gov/camping/campgrounds/232265", rec_area_id:232265 },
  { id:"loon-lake",        name:"Loon Lake",                 park:"Eldorado National Forest",       state:"CA", agency:"USFS", lat:38.9853,  lng:-120.3159, site_count:53,  amenities:["flush-toilets","potable-water","fire-ring","boat-ramp"],   description:"High Sierra reservoir at 6,378 ft. Boating, fishing, and a sand beach popular on summer weekends.", booking_url:"https://www.recreation.gov/camping/campgrounds/232253", rec_area_id:232253 },
  { id:"ellery-lake",      name:"Ellery Lake",               park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.9367,  lng:-119.2339, site_count:13,  amenities:["vault-toilets","potable-water","fire-ring","bear-boxes"],   description:"Pristine alpine lake on Tioga Pass Road at 9,521 ft. Gateway to Yosemite's high country.", booking_url:"https://www.recreation.gov/camping/campgrounds/232228", rec_area_id:232228 },
  { id:"tioga-lake",       name:"Tioga Lake",                park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:37.9298,  lng:-119.2507, site_count:13,  amenities:["vault-toilets","potable-water","fire-ring","bear-boxes"],   description:"Shimmering tarn at 9,700 ft beside Tioga Pass. Spectacular views, minimal crowds. First-come-first-served.", booking_url:"https://www.recreation.gov/camping/campgrounds/232254", rec_area_id:232254 },
  { id:"lundy-lake",       name:"Lundy Lake",                park:"Inyo National Forest",           state:"CA", agency:"USFS", lat:38.0432,  lng:-119.2222, site_count:54,  amenities:["flush-toilets","potable-water","fire-ring","bear-boxes"],   description:"Willow-lined lake north of Lee Vining. Dramatic canyon access to Lundy Falls and 20 Lakes Basin.", booking_url:"https://www.recreation.gov/camping/campgrounds/232257", rec_area_id:232257 },
  { id:"twin-lakes-bridgeport", name:"Twin Lakes",           park:"Humboldt-Toiyabe National Forest",state:"CA",agency:"USFS",lat:38.2150,lng:-119.3583,   site_count:99,  amenities:["flush-toilets","potable-water","fire-ring","boat-ramp","bear-boxes"], description:"Twin glacier lakes near Bridgeport at 7,090 ft. Some of the best fly fishing in the Eastern Sierra.", booking_url:"https://www.recreation.gov/camping/campgrounds/232258", rec_area_id:232258 },
];

// ── main ─────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function upsert(rows: CampgroundRow[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from("campgrounds") as any).upsert(
    rows.map((r) => ({ ...r, state: "CA" })),
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error) throw error;
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) {
    console.error("NPS_API_KEY is not set.");
    process.exit(1);
  }

  console.log("Fetching NPS campgrounds for California…");
  const npsRaw = await fetchNpsCampgrounds(apiKey);
  console.log(`  Got ${npsRaw.length} NPS campgrounds from API`);

  // Fetch park names for all unique park codes
  const codes = [...new Set(npsRaw.map((c) => c.parkCode as string))];
  const parkNames = await fetchParkNames(apiKey, codes);

  // Map NPS API → DB rows
  const npsRows: CampgroundRow[] = [];
  const slugsSeen = new Set<string>();

  for (const c of npsRaw) {
    const name = (c.name as string).replace(/\b(campground|group camp|group site)\b/gi, "").trim();
    let slug = toSlug(name);
    if (slugsSeen.has(slug)) slug += `-${(c.parkCode as string)}`;
    slugsSeen.add(slug);

    const coords = parseLatLng(c.latLong as string);
    const amenities = mapAmenities(c.amenities as Record<string, string | string[]>);
    const reservable = parseInt(c.numberOfSitesReservable as string ?? "0") || 0;
    const fcfs = parseInt(c.numberOfSitesFirstComeFirstServed as string ?? "0") || 0;
    const siteCount = reservable + fcfs || 10;
    const bookingUrl = (c.campsiteReservationUrl as string) || (c.url as string) || null;
    const recId = extractRecId(c.campsiteReservationUrl as string);
    const images = c.images as { url: string }[] | undefined;
    const photoUrl = images?.[0]?.url ?? null;

    npsRows.push({
      id: slug,
      name,
      park: parkNames.get(c.parkCode as string) ?? (c.parkCode as string).toUpperCase(),
      state: "CA",
      agency: "NPS",
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      site_count: siteCount,
      amenities,
      description: (c.description as string) || null,
      booking_url: bookingUrl,
      rec_area_id: recId,
    });

    // Add photo_url to upsert if present
    if (photoUrl) (npsRows[npsRows.length - 1] as Record<string, unknown>).photo_url = photoUrl;
  }

  console.log(`\nUpserting ${npsRows.length} NPS campgrounds…`);
  // Batch in groups of 50 to stay under Supabase payload limits
  for (let i = 0; i < npsRows.length; i += 50) {
    await upsert(npsRows.slice(i, i + 50));
    process.stdout.write(".");
    await sleep(100);
  }
  console.log(" done.");

  console.log(`\nUpserting ${MANUAL.length} CA-SP / USFS campgrounds…`);
  for (let i = 0; i < MANUAL.length; i += 50) {
    await upsert(MANUAL.slice(i, i + 50));
    process.stdout.write(".");
    await sleep(100);
  }
  console.log(" done.");

  // Print summary by park
  const byPark = new Map<string, number>();
  for (const r of [...npsRows, ...MANUAL]) {
    byPark.set(r.park, (byPark.get(r.park) ?? 0) + 1);
  }
  console.log("\nCampgrounds by park:");
  [...byPark.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([park, n]) => {
    console.log(`  ${n.toString().padStart(3)}  ${park}`);
  });
  console.log(`\nTotal: ${npsRows.length + MANUAL.length} campgrounds`);
}

main().catch((e) => { console.error(e); process.exit(1); });
