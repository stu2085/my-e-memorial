import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/reset-password",
        "/admin",
        "/memorial/*/edit",
        "/advertiser/*/edit",
        "/advertiser/*/dashboard",
      ],
    },
  ],
  sitemap: "https://www.myememorial.com/sitemap.xml",
};
}