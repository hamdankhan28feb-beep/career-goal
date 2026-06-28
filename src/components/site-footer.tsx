import Link from 'next/link';
import { GraduationCap, Twitter, Linkedin, Facebook, Mail, MapPin, Phone } from 'lucide-react';

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
  ],
  account: [
    { href: '/auth/login', label: 'Login' },
    { href: '/auth/signup', label: 'Sign Up' },
    { href: '/admin', label: 'Admin Dashboard' },
  ],
};

const universities = ['NED University', 'FAST Karachi', 'IBA Karachi', 'Habib University', 'MAJU', 'SZABIST'];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/50 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-glow-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-foreground">FuturePath</div>
                <div className="text-xs text-muted-foreground">University intelligence for Pakistan</div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              Pakistan&apos;s most comprehensive university and career counseling platform. Explore Karachi universities, compare programs, and discover your path with AI guidance.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="mailto:contact@futurepath.pk" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
                <Mail className="h-3.5 w-3.5" />
                contact@futurepath.pk
              </a>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Karachi, Sindh, Pakistan
            </div>
            <div className="mt-4 flex gap-3">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Facebook, href: '#', label: 'Facebook' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
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

          {/* Tools */}
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

          {/* Account */}
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

        {/* Featured Universities Row */}
        <div className="mt-10 rounded-2xl border border-border/50 bg-muted/40 p-4">
          <p className="mb-3 text-xs text-muted-foreground">Explore top Karachi universities:</p>
          <div className="flex flex-wrap gap-2">
            {universities.map((uni) => (
              <Link
                key={uni}
                href={`/universities`}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {uni}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FuturePath. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Data sourced from official university websites and admissions portals only.
          </p>
        </div>
      </div>
    </footer>
  );
}
