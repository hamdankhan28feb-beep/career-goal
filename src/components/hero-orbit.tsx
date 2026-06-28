'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { University } from '@/lib/types';

const ORBIT_CONFIGS = [
  { radius: 160, duration: 18, start: 0 },
  { radius: 160, duration: 18, start: 60 },
  { radius: 160, duration: 18, start: 120 },
  { radius: 160, duration: 18, start: 180 },
  { radius: 230, duration: 28, start: 0 },
  { radius: 230, duration: 28, start: 72 },
  { radius: 230, duration: 28, start: 144 },
  { radius: 230, duration: 28, start: 216 },
  { radius: 230, duration: 28, start: 288 },
  { radius: 300, duration: 40, start: 36 },
  { radius: 300, duration: 40, start: 108 },
  { radius: 300, duration: 40, start: 180 },
];

function UniversityOrb({
  university,
  radius,
  duration,
  startAngle,
}: {
  university: University;
  radius: number;
  duration: number;
  startAngle: number;
}) {
  const [angle, setAngle] = useState(startAngle);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const deg = startAngle + (elapsed / duration) * 360;
      setAngle(deg);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [startAngle, duration]);

  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  const counterRad = (-angle * Math.PI) / 180;
  const cos = Math.cos(counterRad);
  const sin = Math.sin(counterRad);

  return (
    <Link
      href={`/universities/${university.slug}`}
      className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-border/70 bg-card/90 text-xs font-bold uppercase shadow-card backdrop-blur transition hover:-translate-y-[calc(50%+4px)] hover:border-primary/50 hover:shadow-glow-primary hover:z-10 cursor-pointer"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
      }}
      title={university.name}
    >
      <span style={{ transform: `rotate(${angle}deg)` }} className="select-none">
        {university.shortName.slice(0, 4)}
      </span>
    </Link>
  );
}

export function HeroOrbit({ universities }: { universities: University[] }) {
  const orbs = universities.slice(0, 12);

  return (
    <div className="relative hidden lg:flex items-center justify-center" style={{ width: 680, height: 680 }}>
      {/* Orbit rings */}
      <div className="absolute rounded-full border border-dashed border-primary/15" style={{ width: 320, height: 320 }} />
      <div className="absolute rounded-full border border-dashed border-primary/10" style={{ width: 460, height: 460 }} />
      <div className="absolute rounded-full border border-dashed border-primary/8" style={{ width: 600, height: 600 }} />

      {/* Center orb */}
      <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-glow-primary">
        <span className="text-2xl">🎓</span>
        <span className="mt-1 text-xs font-bold">FuturePath</span>
      </div>

      {/* Orbiting university badges */}
      {orbs.map((uni, i) => {
        const cfg = ORBIT_CONFIGS[i % ORBIT_CONFIGS.length];
        return (
          <UniversityOrb
            key={uni.slug}
            university={uni}
            radius={cfg.radius}
            duration={cfg.duration}
            startAngle={cfg.start}
          />
        );
      })}
    </div>
  );
}