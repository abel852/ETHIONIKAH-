import type { MetadataRoute } from "next";

const SITE_URL = "https://ethionikah.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicPages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    { path: "/membership", priority: 0.9, changeFrequency: "weekly" },
    { path: "/islamic-marriage-guide", priority: 0.8, changeFrequency: "monthly" },
    { path: "/marriage-tips", priority: 0.7, changeFrequency: "monthly" },
    { path: "/safety-guidelines", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.5, changeFrequency: "yearly" },
    { path: "/terms-of-service", priority: 0.5, changeFrequency: "yearly" },
    { path: "/login", priority: 0.6, changeFrequency: "monthly" },
    { path: "/register", priority: 0.7, changeFrequency: "monthly" },
    { path: "/forgot-password", priority: 0.3, changeFrequency: "yearly" },
    { path: "/contact-support", priority: 0.5, changeFrequency: "monthly" },
  ];

  return publicPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
