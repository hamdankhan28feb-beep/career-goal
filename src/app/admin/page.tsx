import Link from 'next/link';
import { getUniversities, getFields } from '@/lib/data';
import { AdminLogoutButton } from '@/components/admin-logout-button';
import { BarChart2, Building2, GraduationCap, Award, Star, ArrowRight, BookOpen } from 'lucide-react';

export default async function AdminPage() {
  const universities = await getUniversities();
  const fields = getFields();

  const totalPrograms = universities.reduce((a, u) => a + u.programsCount, 0);
  const totalScholarships = universities.reduce((a, u) => a + u.scholarships.length, 0);
  const totalReviews = universities.reduce((a, u) => a + u.reviews.length, 0);
  const avgCompleteness = Math.round(universities.reduce((a, u) => a + u.dataCompleteness, 0) / (universities.length || 1));

  const stats = [
    { label: 'Universities', value: universities.length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Programs', value: totalPrograms, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Fields Mapped', value: fields.length, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Scholarships', value: totalScholarships, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Reviews', value: totalReviews, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Avg. Data %', value: `${avgCompleteness}%`, icon: BarChart2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  const adminLinks = [
    { href: '/admin/universities', icon: Building2, label: 'Manage Universities', desc: 'View, edit, and update university data' },
    { href: '/admin/scholarships', icon: Award, label: 'Manage Scholarships', desc: 'Review and update scholarship information' },
    { href: '/admin/reviews', icon: Star, label: 'Moderate Reviews', desc: 'Review and approve student submissions' },
    { href: '/universities', icon: GraduationCap, label: 'View Public Site', desc: 'See the live university explorer' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 mb-3">
            ⚙️ Admin Dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">FuturePath Admin</h1>
          <p className="mt-2 text-muted-foreground">Manage university data, scholarships, and reviews</p>
        </div>
        <AdminLogoutButton />
      </div>

      {/* Stats Grid */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="group rounded-3xl border border-border/70 bg-card/80 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Data Completeness Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Data Completeness by University</h2>
        <div className="rounded-3xl border border-border/70 bg-card/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">University</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">City</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Programs</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Scholarships</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Data %</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {universities.map((u) => (
                <tr key={u.slug} className="hover:bg-muted/20 transition">
                  <td className="px-5 py-3 font-medium text-foreground">{u.shortName}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{u.city}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{u.programsCount}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">{u.scholarships.length}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${u.dataCompleteness >= 60 ? 'bg-emerald-500' : u.dataCompleteness >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${u.dataCompleteness}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{u.dataCompleteness}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/universities/${u.slug}`} className="text-xs text-primary hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
