'use client';

import { useState } from 'react';
import { Star, CheckCircle2, X } from 'lucide-react';

type RatingCategory = 'ratingOverall' | 'ratingFaculty' | 'ratingFacilities' | 'ratingValueForMoney';

const RATING_LABELS: { key: RatingCategory; label: string }[] = [
  { key: 'ratingOverall', label: 'Overall Experience' },
  { key: 'ratingFaculty', label: 'Faculty Quality' },
  { key: 'ratingFacilities', label: 'Facilities' },
  { key: 'ratingValueForMoney', label: 'Value for Money' },
];

const REVIEWER_TYPES = ['Current Student', 'Alumni', 'Prospective Student', 'Parent'];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 transition ${i <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  universitySlug,
  universityName,
  defaultOpen = false,
}: {
  universitySlug: string;
  universityName: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    reviewerType: 'Current Student',
    ratingOverall: 0,
    ratingFaculty: 0,
    ratingFacilities: 0,
    ratingValueForMoney: 0,
    positiveExperiences: '',
    commonComplaints: '',
  });

  const setRating = (key: RatingCategory) => (value: number) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.ratingOverall === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universitySlug,
          universityName,
          reviewerType: form.reviewerType,
          ratingOverall: form.ratingOverall,
          ratingFaculty: form.ratingFaculty,
          ratingFacilities: form.ratingFacilities,
          ratingValueForMoney: form.ratingValueForMoney,
          positiveExperiences: form.positiveExperiences,
          commonComplaints: form.commonComplaints,
          pros: [],
          cons: [],
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setError('Could not submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 btn-secondary text-sm"
      >
        <Star className="h-4 w-4" /> Write a Review
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/8 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
        <h3 className="font-semibold text-foreground">Review Submitted!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for reviewing {universityName}. Your review will be published after moderation.
        </p>
        <button onClick={() => { setSubmitted(false); setOpen(false); }} className="mt-4 btn-secondary text-sm">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-3xl border border-border/70 bg-card/80 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Review {universityName}</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Reviewer Type */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">You are a…</label>
        <div className="flex flex-wrap gap-2">
          {REVIEWER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((p) => ({ ...p, reviewerType: type }))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                form.reviewerType === type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/70 text-muted-foreground hover:border-primary/30'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Star Ratings */}
      <div className="mb-4 space-y-3">
        {RATING_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <StarPicker value={form[key] as number} onChange={setRating(key)} />
          </div>
        ))}
      </div>

      {/* Text Fields */}
      <div className="mb-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">What did you like most? <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            value={form.positiveExperiences}
            onChange={(e) => setForm((p) => ({ ...p, positiveExperiences: e.target.value }))}
            placeholder="Great faculty, good campus, strong alumni network…"
            className="input-field resize-none h-20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">What could be improved? <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            value={form.commonComplaints}
            onChange={(e) => setForm((p) => ({ ...p, commonComplaints: e.target.value }))}
            placeholder="Parking is a challenge, cafeteria food is basic…"
            className="input-field resize-none h-20"
          />
        </div>
      </div>

      {form.ratingOverall === 0 && (
        <p className="mb-3 text-xs text-amber-500">Please rate your overall experience to submit.</p>
      )}

      {error && (
        <div className="mb-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={form.ratingOverall === 0 || loading}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
