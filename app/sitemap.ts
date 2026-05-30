import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://campsearch.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: campgrounds } = await supabase
    .from("campgrounds")
    .select("id, created_at")
    .order("name")
    .limit(500);

  const campgroundUrls: MetadataRoute.Sitemap = (campgrounds ?? []).map(
    (c) => ({
      url: `${SITE_URL}/campgrounds/${c.id}`,
      lastModified: new Date(c.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...campgroundUrls,
  ];
}
