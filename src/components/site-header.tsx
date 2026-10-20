'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, GraduationCap, ChevronDown, LogOut, Shield, User } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import type { SessionUser } from '@/lib/auth';
import { useScrollLock } from '@/lib/use-scroll-lock';

const navItems = [
  { href: '/universities', label: 'Universities' },
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/fields', label: 'Fields' },
  { href: '/compare', label: 'Compare' },
  {
    label: 'Tools',
    children: [
      { href: '/compare/fields', label: 'Compare Fields' },
      { href: '/quiz', label: 'Career Quiz' },
      { href: '/predictor', label: 'Admission Predictor' },
    ],
  },
  { href: '/counselor', label: 'AI Counselor' },
];

// ─── User Avatar + Dropdown ──────────────────────────────────────────────────

function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border/60 py-1.5 pl-1.5 pr-3 transition hover:border-primary/40 hover:bg-muted"
        aria-label="User menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-2xs font-bold text-white">
          {initials}
        </span>
        <span className="max-w-[100px] truncate text-sm font-medium text-foreground">
          {user.name}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-border/70 bg-card p-2 shadow-glow animate-slide-down">
          <div className="mb-1 border-b border-border/50 px-3 py-2">
            <div className="truncate text-sm font-medium text-foreground">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <User className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Guest Actions (Login / Sign Up) ────────────────────────────────────────

function GuestActions({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="mt-4 flex gap-3 border-t border-border/50 pt-4">
        <Link
          href="/auth/login"
          className="flex-1 rounded-full border border-border/60 py-2.5 text-center text-sm transition hover:border-primary/40"
        >
          Login
        </Link>
        <Link href="/auth/signup" className="flex-1 btn-primary py-2.5 text-center text-sm">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/auth/login"
        className="rounded-full border border-border/60 px-4 py-2 text-sm text-foreground transition hover:border-primary/40 hover:text-primary"
      >
        Login
      </Link>
      <Link href="/auth/signup" className="btn-primary py-2 text-xs">
        Get Started
      </Link>
    </>
  );
}

// ─── Main Header Navigation ─────────────────────────────────────────────────

export function HeaderNav({ user }: { user?: SessionUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/') && !(href === '/compare' && pathname.startsWith('/compare/fields')));
  const toolsActive = navItems.some((i) => i.children?.some((c) => isActive(c.href)));
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useScrollLock(mobileOpen, closeMobile);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex items-center justify-between py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-success text-sm font-black text-white shadow-glow-primary transition group-hover:scale-105">
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
                  aria-current={toolsActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1 nav-link rounded-full px-3 py-2 hover:bg-muted xl:px-4 ${toolsActive ? 'text-foreground after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-cyan-400' : ''}`}
                >
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>
                {toolsOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-2xl border border-border/70 bg-card shadow-glow p-2 animate-slide-down">
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
                aria-current={isActive(item.href!) ? 'page' : undefined}
                className={`relative nav-link rounded-full px-3 py-2 hover:bg-muted xl:px-4 ${isActive(item.href!) ? 'text-foreground after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-cyan-400' : ''}`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <GuestActions />
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:bg-muted transition"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div id="mobile-menu" data-testid="mobile-menu" className="max-h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain border-t border-border/50 bg-background/98 backdrop-blur-xl lg:hidden animate-slide-down">
          <div className="container-page space-y-1 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</div>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={isActive(child.href) ? 'page' : undefined}
                      className={`block rounded-xl px-4 py-2.5 text-sm hover:bg-muted hover:text-foreground transition ${isActive(child.href) ? 'border-l-2 border-cyan-400 text-foreground' : 'text-muted-foreground'}`}
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
                  aria-current={isActive(item.href!) ? 'page' : undefined}
                  className={`block rounded-xl px-4 py-2.5 text-sm hover:bg-muted hover:text-foreground transition ${isActive(item.href!) ? 'border-l-2 border-cyan-400 text-foreground' : 'text-muted-foreground'}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            {user ? (
              <div className="mt-4 border-t border-border/50 pt-4 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-2xs font-bold text-white">
                    {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/auth/login';
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <GuestActions mobile />
            )}
          </div>
        </div>
      )}
    </header>
  );
}
