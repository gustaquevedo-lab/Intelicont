import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/onboarding/"],
      },
    ],
    sitemap: "https://intelicont.com/sitemap.xml",
  };
}
