import type { Metadata } from 'next';

import { ReportForm } from './report-form';

export const metadata: Metadata = {
  title: 'Report incorrect information',
  description: 'Tell FuturePath about a field that looks wrong.',
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; field?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container-page py-12">
      <div className="section-label">Corrections</div>
      <h1 className="section-title">Report incorrect information</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        Name the page and the field. If a database is configured, the note is stored for review. It is not published on the university profile by itself.
      </p>
      <ReportForm entity={params.entity ?? ''} fieldKey={params.field ?? ''} />
    </div>
  );
}
