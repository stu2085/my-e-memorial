import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/create-an-online-memorial"],
        disallow: [
          "/api/",
          "/login",
          "/reset-password",
          "/admin/",
          "/create",
          "/my-memorials",
          "/edit/",
          "/memorial/test",
          "/memorial/*/edit",
          "/memorial/*/manage",
          "/memorial/*/presentation",
          "/gift/claim/",
          "/gift/success",
          "/advertise/success",
          "/advertiser/*/edit",
          "/advertiser/*/dashboard",
          "/backup-person/",
          "/campaigns/manage",
          "/funeral-home/",
          "/renew/",
          "/renew-success",
        ],
      },
    ],
    sitemap: "https://www.myememorial.com/sitemap.xml",
  };
}