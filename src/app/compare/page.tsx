import { getUniversities } from '@/lib/data';
import { CompareClient } from './compare-client';

export const metadata = {
  title: 'Compare Universities',
  description: 'Compare Pakistani universities side-by-side on fees, merit, scholarships, and more.',
};

export default async function ComparePage() {
  const universities = await getUniversities();
  return <CompareClient universities={universities} />;
}
