import type { MetadataRoute } from 'next';

const BASE = 'https://freebiefinder.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                          lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/food-drink`,          lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/beauty`,              lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/retail`,              lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/entertainment`,       lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/online`,              lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
