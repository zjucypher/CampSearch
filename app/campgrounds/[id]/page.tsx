import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import CampgroundDetailClient from "./CampgroundDetailClient";
import { fetchNpsPhotoUrl } from "@/lib/nps";

type PageProps = { params: Promise<{ id: string }> };
type Campground = Database["public"]["Tables"]["campgrounds"]["Row"];

function serviceDb() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const fetchCampground = cache(async (id: string): Promise<Campground | null> => {
  const { data } = await serviceDb()
    .from("campgrounds")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
});

/**
 * Resolve a photo URL for a campground:
 *   1. Return the existing DB url if present.
 *   2. Query the NPS API (NPS_API_KEY required).
 *   3. Write the result back to DB so the next request skips the API call.
 *   4. Return null if nothing was found (Photo component falls back to Picsum).
 */
async function resolvePhotoUrl(campground: Campground): Promise<string | null> {
  if (campground.photo_url) return campground.photo_url;

  // Only NPS campgrounds are indexed in the NPS API
  if (campground.agency !== "NPS") return null;

  const url = await fetchNpsPhotoUrl(campground.name, campground.park);
  if (!url) return null;

  // Persist so subsequent renders hit the DB, not the NPS API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceDb().from("campgrounds") as any)
    .update({ photo_url: url })
    .eq("id", campground.id);

  return url;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const c = await fetchCampground(id);
  if (!c) return { title: "Campground Not Found | CampSearch" };

  const description =
    c.description ??
    `Monitor campsite availability at ${c.name} in ${c.park}. Get instant email and SMS alerts when a site opens up.`;

  // Use cached photo_url only for metadata (don't trigger NPS API call here)
  return {
    title: `${c.name} — ${c.park} | CampSearch`,
    description,
    openGraph: {
      title: `${c.name} — ${c.park}`,
      description,
      ...(c.photo_url ? { images: [{ url: c.photo_url }] } : {}),
    },
  };
}

export default async function CampgroundDetailPage({ params }: PageProps) {
  const { id } = await params;
  const campground = await fetchCampground(id);

  if (!campground) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Nav signedIn={true} current="search" />
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "64px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Campground not found</h2>
          <Link href="/search" className="cs-btn">Back to search</Link>
        </div>
      </div>
    );
  }

  // Resolve photo and watched sites in parallel
  const [photoUrl, watchedSiteIds] = await Promise.all([
    resolvePhotoUrl(campground),
    fetchWatchedSiteIds(id),
  ]);

  // Merge resolved photo_url into the campground object for the client
  const campgroundWithPhoto: Campground = photoUrl
    ? { ...campground, photo_url: photoUrl }
    : campground;

  return <CampgroundDetailClient campground={campgroundWithPhoto} watchedSiteIds={watchedSiteIds} />;
}

async function fetchWatchedSiteIds(campgroundId: string): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: alerts } = await supabase
      .from("alerts")
      .select("site_ids, site_mode")
      .eq("user_id", user.id)
      .eq("campground_id", campgroundId)
      .in("status", ["monitoring", "found"]) as {
        data: { site_ids: string[]; site_mode: string }[] | null;
      };

    return (alerts ?? [])
      .filter((a) => a.site_mode === "specific")
      .flatMap((a) => a.site_ids.map((s) => String(s).toUpperCase()));
  } catch {
    return [];
  }
}
