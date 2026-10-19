import Image from 'next/image';
import Link from 'next/link';

import { universityLogos, type UniversityLogo } from '@/data/university-logos';

/**
 * Dual-row university logo marquee (approved design 2026-10-19).
 * Server component, no JS state. Logos are the untouched original files in /public/logos/universities.
 * Each row renders two identical lists; the second is aria-hidden and unfocusable so the -50% loop is seamless
 * while assistive tech and keyboard users only meet the real links. Spacing lives inside each item (pr-*)
 * so copy 1 + its trailing space is exactly half of the track.
 */
function LogoList({ items, duplicate = false }: { items: UniversityLogo[]; duplicate?: boolean }) {
  return (
    <ul
      className={`flex shrink-0 ${duplicate ? 'motion-reduce:hidden' : ''}`}
      aria-hidden={duplicate ? true : undefined}
      data-logo-copy={duplicate ? 'duplicate' : 'primary'}
    >
      {items.map((u) => {
        const ratio = u.width / u.height;
        return (
          <li key={u.slug} className="shrink-0 snap-start pr-3 sm:pr-5">
            <Link
              href={`/universities/${u.slug}`}
              aria-label={duplicate ? undefined : `${u.name} profile`}
              tabIndex={duplicate ? -1 : undefined}
              data-logo-link={duplicate ? undefined : u.slug}
              className={`flex h-[54px] items-center rounded-[11px] border px-3.5 transition-shadow hover:shadow-[0_0_0_2px_theme(colors.cyan.400),0_8px_24px_rgba(34,211,238,.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:h-[72px] sm:rounded-[14px] sm:px-5 ${
                u.chip === 'dark' ? 'border-cyan-400/35 bg-[#132a4a]' : 'border-white/60 bg-[#f4f7fb]'
              }`}
            >
              <Image
                src={u.src}
                alt={duplicate ? '' : `${u.name} logo`}
                width={Math.round(48 * ratio)}
                height={48}
                sizes="(max-width: 640px) 160px, 220px"
                loading="lazy"
                unoptimized={u.src.endsWith('.svg')}
                data-ratio={ratio.toFixed(4)}
                className="h-9 w-auto max-w-[160px] object-contain sm:h-12 sm:max-w-[220px]"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Row({ items, dir }: { items: UniversityLogo[]; dir: 'left' | 'right' }) {
  return (
    <div
      data-logo-row={dir}
      className="group overflow-hidden py-2.5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
    >
      <div
        data-logo-track
        className={`flex w-max ${dir === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'} group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none`}
      >
        <LogoList items={items} />
        <LogoList items={items} duplicate />
      </div>
    </div>
  );
}

export function UniversityLogoSlider() {
  const logos = universityLogos; // all entries, including NEEDS-REVIEW files (approved); status is never displayed
  const half = Math.ceil(logos.length / 2);
  return (
    <section
      aria-labelledby="uni-logos-heading"
      data-testid="university-logo-slider"
      className="mt-16 border-y border-cyan-400/15 bg-gradient-to-b from-[#0b1426] to-[#0f1d36] py-11 sm:py-16 lg:mt-24"
    >
      <div className="container-page pb-7 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-cyan-400" data-testid="logo-count">
          {logos.length} universities · Karachi
        </p>
        <h2 id="uni-logos-heading" className="mb-2 mt-3 text-[clamp(22px,3vw,32px)] font-semibold text-slate-50">
          Explore Universities on FuturePath
        </h2>
        <p className="text-sm text-slate-400 sm:text-base">
          Browse detailed, sourced profiles ·{' '}
          <Link href="/universities" className="tap-target text-cyan-400 underline underline-offset-4 hover:text-cyan-300">
            View all →
          </Link>
        </p>
      </div>
      <Row items={logos.slice(0, half)} dir="left" />
      <Row items={logos.slice(half)} dir="right" />
    </section>
  );
}

export default UniversityLogoSlider;
