'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, GraduationCap, ChevronDown } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/universities', label: 'Universities' },
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/fields', label: 'Fields' },
  {
    label: 'Tools',
    children: [
      { href: '/compare', label: 'Compare Universities' },
      { href: '/compare/fields', label: 'Compare Fields' },
      { href: '/quiz', label: 'Career Quiz' },
      { href: '/predictor', label: 'Admission Predictor' },
    ],
  },
  { href: '/counselor', label: 'AI Counselor' },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-sm font-black text-white shadow-glow-primary transition group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-foreground">FuturePath</div>
            <div className="text-xs text-muted-foreground hidden sm:block">University intelligence for Pakistan</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label} className="relative">
                <button
                  onClick={() => setToolsOpen(!toolsOpen)}
                  onBlur={() => setTimeout(() => setToolsOpen(false), 150)}
                  className="flex items-center gap-1 nav-link rounded-full px-4 py-2 hover:bg-muted"
                >
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>
                {toolsOpen && (
                  <div className="absolute top-full mt-1 w-52 rounded-2xl border border-border/70 bg-card shadow-glow p-2 animate-slide-down">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        onClick={() => setToolsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="nav-link rounded-full px-4 py-2 hover:bg-muted"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/auth/login"
            className="rounded-full border border-border/60 px-4 py-2 text-sm text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            Login
          </Link>
          <Link href="/auth/signup" className="btn-primary py-2 text-xs">
            Get Started
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-border/60 p-2 text-muted-foreground hover:bg-muted transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/98 backdrop-blur-xl lg:hidden animate-slide-down">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</div>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="block rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="mt-4 flex gap-3 border-t border-border/50 pt-4">
              <Link href="/auth/login" className="flex-1 rounded-full border border-border/60 py-2.5 text-center text-sm transition hover:border-primary/40" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/auth/signup" className="flex-1 btn-primary py-2.5 text-center text-sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
