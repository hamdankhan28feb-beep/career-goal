import type { Metadata } from 'next';

import { ScholarshipFinder } from '@/components/scholarship-finder';

export const metadata: Metadata = {
  title: 'Scholarship Finder | FuturePath',
  description:
    'Search Pakistani scholarships with official source links, eligibility, coverage and honest Active / Closed / Unknown status.',
};

export default function ScholarshipsPage() {
  return <ScholarshipFinder />;
}
