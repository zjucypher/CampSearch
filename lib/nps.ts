/**
 * NPS (National Park Service) Data API client.
 * Free API key: https://www.nps.gov/subjects/developer/get-started.htm
 *
 * Strategy:
 *   1. Fetch all CA NPS campgrounds in one call, match by normalized name.
 *   2. If no campground match, fall back to the park-level photos API
 *      (covers concessionaire sites like Half Dome Village / Curry Village).
 */

const NPS_API_BASE = "https://developer.nps.gov/api/v1";

interface NpsImage {
  url: string;
  title: string;
  altText: string;
}

interface NpsCampground {
  id: string;
  name: string;
  parkCode: string;
  images: NpsImage[];
}

/** Strip common suffixes so "Upper Pines" matches "Upper Pines Campground". */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(campground|camp|campsite|group site|group camp|rv park|backcountry|primitive)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.9;
  const aWords = new Set(an.split(/\s+/).filter(Boolean));
  const bWords = bn.split(/\s+/).filter(Boolean);
  const matches = bWords.filter((w) => aWords.has(w)).length;
  // Use min so that if all words in the shorter name appear in the longer NPS
  // name it scores well — e.g. "Scorpion Ranch" → "Scorpion Canyon Campground"
  return matches / Math.min(aWords.size, bWords.length, 5);
}

/** Fetch all NPS campgrounds in California with images (cached 7 days). */
async function fetchCaCampgrounds(apiKey: string): Promise<NpsCampground[]> {
  const params = new URLSearchParams({ stateCode: "CA", limit: "500", api_key: apiKey });
  const res = await fetch(`${NPS_API_BASE}/campgrounds?${params}`, {
    next: { revalidate: 7 * 24 * 3600 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).filter(
    (c: NpsCampground) => Array.isArray(c.images) && c.images.length > 0
  );
}

/** Search the NPS parks API for a park matching the given name, return first photo. */
async function fetchParkPhotoUrl(parkName: string, apiKey: string): Promise<string | null> {
  // Extract the short park name (e.g. "Yosemite" from "Yosemite National Park")
  const shortName = parkName
    .replace(/\b(national park|state park|national monument|national recreation area|national seashore|nra)\b/gi, "")
    .trim();

  const params = new URLSearchParams({
    q: shortName,
    stateCode: "CA",
    limit: "5",
    api_key: apiKey,
    fields: "images",
  });

  try {
    const res = await fetch(`${NPS_API_BASE}/parks?${params}`, {
      next: { revalidate: 7 * 24 * 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();

    // Find the best-matching park and return its first image
    for (const park of json.data ?? []) {
      const images: NpsImage[] = park.images ?? [];
      if (images.length > 0 && similarity(shortName, park.fullName ?? park.name) >= 0.3) {
        return images[0].url;
      }
    }
    // Just take the first result's photo if we got something back
    const first = json.data?.[0];
    return first?.images?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Find the best NPS photo URL for a campground.
 *   1. Match against the full CA campgrounds catalog.
 *   2. If not found, fall back to a park-level photo (e.g. Half Dome Village).
 * Returns null when NPS_API_KEY is absent or nothing matches.
 */
export async function fetchNpsPhotoUrl(
  campgroundName: string,
  parkName?: string | null
): Promise<string | null> {
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) return null;

  try {
    // 1. Try campground-level match
    const campgrounds = await fetchCaCampgrounds(apiKey);
    if (campgrounds.length) {
      const scored = campgrounds
        .map((c) => ({ c, score: similarity(campgroundName, c.name) }))
        .filter(({ score }) => score >= 0.3)
        .sort((a, b) => b.score - a.score);

      if (scored[0]) return scored[0].c.images[0].url;
    }

    // 2. Fall back to park-level photo
    if (parkName) {
      return await fetchParkPhotoUrl(parkName, apiKey);
    }

    return null;
  } catch {
    return null;
  }
}
