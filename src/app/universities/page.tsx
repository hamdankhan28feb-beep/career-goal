import { getUniversities } from '@/lib/data';
import { UniversitiesClient } from './universities-client';

export const metadata = {
  title: 'University Explorer',
  description: 'Browse Pakistani universities with source-verified profiles. Filter by city, type, and more.',
};

export default async function UniversitiesPage() {
  const universities = await getUniversities();
  return <UniversitiesClient universities={universities} />;
}
