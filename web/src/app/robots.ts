import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/how-it-works", "/safety", "/faq", "/reminders", "/c/", "/a/"],
      disallow: ["/circles", "/new"],
    },
    sitemap: "https://circles.artwebin.com/sitemap.xml",
  };
}
