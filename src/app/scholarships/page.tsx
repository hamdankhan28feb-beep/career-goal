import type { Metadata } from 'next';

import { ScholarshipFinder } from '@/components/scholarship-finder';
import { catalogueScholarships } from '@/lib/scholarship-catalogue';

export const metadata: Metadata = {
  title: 'Scholarship Finder | FuturePath',
  description:
    'Search Pakistani scholarships with official source links. Status is open, upcoming, closed, or unknown. None are called open unless the record says so.',
};

export default function ScholarshipsPage() {
  return <ScholarshipFinder initialRows={catalogueScholarships()} initialSource="research_json" />;
}
