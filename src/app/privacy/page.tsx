import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How FuturePath handles account data, marks and budget inputs.',
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-12">
      <div className="section-label">Privacy</div>
      <h1 className="section-title">Privacy policy</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          An account stores the name, email, city and a password hash you submit at signup, or the name and verified email returned by Google when that sign-in is configured. Session cookies are httpOnly.
        </p>
        <p>
          <strong className="text-foreground">Marks and budget.</strong> The admission predictor keeps Matric percentage, Intermediate percentage and budget in the page&apos;s memory for that visit. They are not written to the database, local storage or a cookie, and they are not sent to an API. Quiz answers are kept in page memory the same way. Closing the page clears them.
        </p>
        <p>
          The report form stores the path, an optional field name and the message you type. It asks for an email only if you choose to leave one. Do not include marks or identity documents in that message.
        </p>
        <p>
          FuturePath does not sell personal information. A contact email is shown only when the site operator sets NEXT_PUBLIC_CONTACT_EMAIL.
        </p>
        <p>
          <Link href="/about" className="text-primary hover:underline">About</Link>
          {' · '}
          <Link href="/report" className="text-primary hover:underline">Report incorrect information</Link>
        </p>
      </div>
    </div>
  );
}
