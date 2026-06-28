import type { MetadataRoute } from 'next';
import { getUniversities } from '@/lib/data';
import { getFields } from '@/lib/fields-data';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://futurepath.pk';

export default function sitemap(): MetadataRoute.Sitemap {
  const universities = getUniversities();
  const fields = getFields();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/universities`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/fields`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/predictor`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/quiz`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/compare/fields`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/counselor`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];

  const universityRoutes: MetadataRoute.Sitemap = universities.map((u) => ({
    url: `${BASE_URL}/universities/${u.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const fieldRoutes: MetadataRoute.Sitemap = fields.map((f) => ({
    url: `${BASE_URL}/fields/${f.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...universityRoutes, ...fieldRoutes];
}
