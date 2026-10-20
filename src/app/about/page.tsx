import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'How FuturePath labels evidence, and what the editorial rules are.',
};

export default function AboutPage() {
  return (
    <div className="container-page py-12">
      <div className="section-label">Editorial</div>
      <h1 className="section-title">About FuturePath</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          FuturePath is a growing university and career guide for Pakistan, starting with Karachi. It is an independent project. It is not a university, HEC, or an admissions office.
        </p>
        <p>
          A field is <strong className="text-foreground">Verified</strong> only when a reliable source supports that specific field for the stated period, and a verification event records the source URL and the date of the check. <strong className="text-foreground">Approximate</strong> means an explicit estimate with a disclosed basis. <strong className="text-foreground">Unverified</strong> means the evidence is not sufficient. The university badge is derived from those field statuses. It is not stored as a hand-set label.
        </p>
        <p>
          Source priority is HEC listings, official university sites, admissions pages, prospectuses, fee schedules and merit lists. A homepage alone is not treated as proof of a fee, a deadline or a merit figure. If a page cannot be fetched, the field stays unverified. Wikipedia and aggregators are not used as proof. When sources conflict, both are shown and no single value is invented.
        </p>
        <p>
          HEC ORIC W, X and Y categories are research-office evaluations for a financial year. They are not an overall university ranking.
        </p>
        <p>
          The career quiz suggests fields from your answers. It does not guarantee a job. The predictor does not publish a chance unless a sourced closing aggregate is on file, and it never calls that figure an official cutoff.
        </p>
        <p>
          <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>
          {' · '}
          <Link href="/report" className="text-primary hover:underline">Report incorrect information</Link>
        </p>
      </div>
    </div>
  );
}
