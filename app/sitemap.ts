import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.myememorial.com";

  const staticPages = [
  "",
  "/search",
  "/contact",
  "/advertise",
    "/privacy",
"/terms",
"/content-removal",
"/refund-policy",
"/dmca",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
priority: route === "" ? 1 : 0.8,
  }));

  const { data: memorials } = await supabase
    .from("memorials")
    .select("slug, updated_at")
    .eq("is_published", true);

  const memorialPages =
  memorials?.map((memorial) => ({
    url: `${baseUrl}/memorial/${memorial.slug}`,
    lastModified: memorial.updated_at
      ? new Date(memorial.updated_at)
      : new Date(),
    priority: 0.9,
  })) || [];

  return [...staticPages, ...memorialPages];
}