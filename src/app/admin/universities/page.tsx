'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ArrowLeft, ExternalLink, ShieldCheck, Pencil, Trash2, X, Plus, Sparkles } from 'lucide-react';
import type { University } from '@/lib/types';

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<University | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [city, setCity] = useState('Karachi');
  const [type, setType] = useState('Private');
  const [website, setWebsite] = useState('');
  const [portal, setPortal] = useState('');
  const [year, setYear] = useState('');
  const [hecStatus, setHecStatus] = useState('Recognized');
  const [overview, setOverview] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  async function fetchUniversities() {
    try {
      const res = await fetch('/api/reviews'); // Safe to check admin
      if (res.ok) {
        // Fetch all universities
        const uRes = await fetch('/api/counselor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'list all universities' }),
        });
        // We can just call a direct fetch of public universities or mock-load them
        const response = await fetch('/api/reviews'); // Admin check
        if (response.ok) {
          // Let's call Next.js API or get data from a simple fetch. Since we want live data:
          // We can create a quick sub-route GET /api/universities that returns all. Let's make sure that's supported.
          const ulistRes = await fetch('/api/universities/get-all'); // wait, let's look at GET in our /api/universities route.
          // Wait! In our /api/universities/route.ts, we did not define a GET method. We should define one, or we can just fetch from the public page or a custom api!
          // Actually, let's add a GET method to /api/universities/route.ts that returns all universities so we don't need a separate endpoint!
        }
      }
    } catch {
      // Fallback
    }
  }

  // To make it simple and elegant, we can load the initial universities from a fetch endpoint.
  // Let's modify our /api/universities/route.ts to also support GET /api/universities so we can load them live!
  // Let's fetch the list of universities on client load.
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/universities');
        if (res.ok) {
          const data = await res.json() as { universities: University[] };
          setUniversities(data.universities);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function openAddModal() {
    setEditingUni(null);
    setName('');
    setShortName('');
    setCity('Karachi');
    setType('Private');
    setWebsite('');
    setPortal('');
    setYear('');
    setHecStatus('Recognized');
    setOverview('');
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(uni: University) {
    setEditingUni(uni);
    setName(uni.name);
    setShortName(uni.shortName);
    setCity(uni.city);
    setType(uni.universityType);
    setWebsite(uni.officialWebsite || '');
    setPortal(uni.admissionsPortal || '');
    setYear(uni.yearEstablished ? String(uni.yearEstablished) : '');
    setHecStatus(uni.hecStatus || 'Recognized');
    setOverview(uni.overview.history || '');
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleDelete(slug: string) {
    if (!confirm('Are you sure you want to delete this university?')) return;
    try {
      const res = await fetch(`/api/universities?slug=${slug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUniversities((prev) => prev.filter((u) => u.slug !== slug));
      } else {
        alert('Failed to delete university.');
      }
    } catch (err) {
      alert('Error deleting university.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setFormLoading(true);

    const payload = {
      basic_information: {
        name: name.trim(),
        short_name: shortName.trim() || name.trim(),
        city,
        university_type: type,
        official_website: website.trim(),
        admissions_portal: portal.trim(),
        year_established: year ? parseInt(year) : null,
        hec_status: hecStatus,
      },
      university_overview: {
        history: overview.trim() || null,
      },
    };

    try {
      if (editingUni) {
        // Update
        const res = await fetch('/api/universities', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, targetSlug: editingUni.slug }),
        });
        if (res.ok) {
          const data = await res.json() as { university: any };
          // reload page or update state
          window.location.reload();
        } else {
          const errData = await res.json() as { error?: string };
          setFormError(errData.error || 'Failed to update university.');
        }
      } else {
        // Create
        const res = await fetch('/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json() as { university: any };
          window.location.reload();
        } else {
          const errData = await res.json() as { error?: string };
          setFormError(errData.error || 'Failed to create university.');
        }
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Admin Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Manage Universities</h1>
          <p className="mt-2 text-muted-foreground">{universities.length} universities in the database</p>
        </div>
        <button onClick={openAddModal} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add University
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-3xl border border-border/70 bg-card/80 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">City</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Programs</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Accreditations</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Data</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {universities.map((u) => (
                <tr key={u.slug} className="hover:bg-muted/20 transition">
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{u.shortName}</div>
                    <div className="text-xs text-muted-foreground">{u.name}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{u.city}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.universityType === 'Public' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                      {u.universityType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{u.programsCount || '—'}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {u.accreditations && u.accreditations.length > 0 ? (
                      <div className="flex items-center gap-1 text-emerald-500 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {u.accreditations.length} body/ies
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${u.dataCompleteness >= 60 ? 'bg-emerald-500' : u.dataCompleteness >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${u.dataCompleteness}%` }} />
                      </div>
                      <span className="text-xs">{u.dataCompleteness}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/universities/${u.slug}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                      <button onClick={() => openEditModal(u)} className="text-xs text-amber-500 hover:text-amber-600 transition flex items-center gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(u.slug)} className="text-xs text-red-500 hover:text-red-600 transition flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-glow overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground transition">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingUni ? 'Edit University' : 'Add University'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">University Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. NED University of Engineering & Technology" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Short Name</label>
                  <input type="text" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. NEDUET" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g. Karachi" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Official Website</label>
                  <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.edu.pk" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Admissions Portal</label>
                  <input type="url" value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="https://admissions.example.edu.pk" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Year Established</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 1921" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">HEC Status</label>
                  <input type="text" value={hecStatus} onChange={(e) => setHecStatus(e.target.value)} placeholder="e.g. Recognized / W4 Category" className="input-field" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Overview & History</label>
                <textarea rows={4} value={overview} onChange={(e) => setOverview(e.target.value)} placeholder="Enter brief history, mission, or vision..." className="input-field resize-none" />
              </div>
              {formError && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{formError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary">
                  {formLoading ? 'Saving...' : 'Save University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
