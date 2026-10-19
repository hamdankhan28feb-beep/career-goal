import Link from 'next/link';
import { GraduationCap, Mail, MapPin } from 'lucide-react';

const footerLinks = {
  platform: [
    { href: '/universities', label: 'University Explorer' },
    { href: '/fields', label: 'Fields Explorer' },
    { href: '/compare', label: 'Compare Universities' },
    { href: '/compare/fields', label: 'Compare Fields' },
  ],
  tools: [
    { href: '/quiz', label: 'Career Quiz' },
    { href: '/predictor', label: 'Admission Predictor' },
    { href: '/counselor', label: 'AI Counselor' },
    { href: '/scholarships', label: 'Scholarships' },
  ],
  account: [
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/report', label: 'Report incorrect information' },
    { href: '/auth/login', label: 'Login' },
    { href: '/auth/signup', label: 'Sign Up' },
  ],
};

const universities = [
  { label: 'NED University', slug: 'neduet-karachi' },
  { label: 'FAST Karachi', slug: 'fast-nuces-karachi' },
  { label: 'IBA Karachi', slug: 'iba-karachi' },
  { label: 'Habib University', slug: 'habib-university' },
  { label: 'MAJU', slug: 'maju-karachi' },
  { label: 'SZABIST', slug: 'szabist-karachi' },
];

export function SiteFooter() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return (
    <footer className="mt-20 border-t border-border/50 bg-card/40">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-glow-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-foreground">FuturePath</div>
                <div className="text-xs text-muted-foreground">A growing guide, starting with Karachi</div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              A growing university and career guide for Pakistan, starting with Karachi. Figures stay blank when they are not sourced.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {contact ? (
                <a href={`mailto:${contact}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
                  <Mail className="h-3.5 w-3.5" />
                  {contact}
                </a>
              ) : (
                <Link href="/report" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
                  <Mail className="h-3.5 w-3.5" />
                  Report incorrect information
                </Link>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Karachi, Sindh, Pakistan
            </div>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Platform</div>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Tools</div>
            <ul className="space-y-2.5">
              {footerLinks.tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Account</div>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border/50 bg-muted/40 p-4">
          <p className="mb-3 text-xs text-muted-foreground">Karachi university profiles:</p>
          <div className="flex flex-wrap gap-2">
            {universities.map((uni) => (
              <Link
                key={uni.slug}
                href={`/universities/${uni.slug}`}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {uni.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FuturePath.
          </p>
          <p className="text-xs text-muted-foreground">
            Data is sourced from official university pages and HEC listings. Unsourced figures are not shown.
          </p>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground sm:text-left" data-testid="trademark-notice">
          University names and logos are trademarks of their respective institutions and are shown only to link to
          FuturePath&rsquo;s independent profiles. No endorsement is implied.
        </p>
      </div>
    </footer>
  );
}
