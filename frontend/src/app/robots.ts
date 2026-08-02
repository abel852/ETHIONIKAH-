import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/faq",
          "/membership",
          "/islamic-marriage-guide",
          "/marriage-tips",
          "/safety-guidelines",
          "/privacy-policy",
          "/terms-of-service",
          "/login",
          "/register",
          "/forgot-password",
          "/contact-support",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/settings",
          "/messages",
          "/profile",
          "/profile/*",
          "/preferences",
          "/discover",
          "/search",
          "/matches",
          "/matches/*",
          "/favorites",
          "/notifications",
          "/verification",
          "/health-info",
          "/user/*",
          "/books/*",
          "/complaints",
          "/wali/*",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://ethionikah.com/sitemap.xml",
    host: "https://ethionikah.com",
  };
}
