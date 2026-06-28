import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';

import { ReviewForm } from '@/components/review-form';
import { getUniversityBySlug } from '@/lib/data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const university = getUniversityBySlug(slug);
  if (!university) return { title: 'Review Not Found' };
  return {
    title: `Review ${university.shortName}`,
    description: `Share your experience at ${university.name} on FuturePath.`,
  };
}

export default async function UniversityReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const university = getUniversityBySlug(slug);
  if (!university) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={`/universities/${slug}#reviews`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {university.shortName}
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <Star className="h-4 w-4" /> Student Review
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Review {university.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Help future students by sharing your honest experience. Reviews are moderated before publication.
        </p>
      </div>

      <ReviewForm universitySlug={slug} universityName={university.shortName} defaultOpen />
    </div>
  );
}
