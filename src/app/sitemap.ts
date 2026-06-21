import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // Mewstro pages
    {
      url: "https://mewstro.com",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://mewstro.com/app",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://mewstro.com/story",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://mewstro.com/pricing",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://mewstro.com/teachers/apply",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://mewstro.com/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://mewstro.com/support",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    // Purrouette pages
    {
      url: "https://purrouette.com",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://purrouette.com/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://purrouette.com/support",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    // Bouldy pages
    {
      url: "https://bouldy.app",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://bouldy.app/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://bouldy.app/support",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
