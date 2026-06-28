import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="mb-6 text-8xl font-black text-muted-foreground/20">404</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching for a university or field instead.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/universities" className="btn-primary">
            Explore Universities <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/fields" className="btn-secondary">
            <Search className="h-4 w-4" /> Browse Fields
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
          {['/', '/universities', '/fields', '/quiz', '/predictor', '/compare', '/counselor'].map((href) => (
            <Link key={href} href={href} className="underline-offset-4 hover:underline hover:text-foreground transition">
              {href === '/' ? 'Home' : href.replace('/', '').replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
