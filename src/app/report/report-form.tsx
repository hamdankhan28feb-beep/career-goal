'use client';

import { useState } from 'react';

export function ReportForm({ entity, fieldKey }: { entity: string; fieldKey: string }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [detail, setDetail] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('idle');
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: window.location.pathname + window.location.search,
        entity_id: entity,
        field_key: fieldKey,
        message,
        contact_email: email,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setStatus('error');
      setDetail(data.error || 'The report could not be saved.');
      return;
    }
    setStatus('sent');
    setMessage('');
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6">
      <div>
        <label htmlFor="entity" className="mb-2 block text-sm font-medium">Record</label>
        <input id="entity" name="entity" defaultValue={entity} readOnly className="input-field" />
      </div>
      <div>
        <label htmlFor="field" className="mb-2 block text-sm font-medium">Field</label>
        <input id="field" name="field" defaultValue={fieldKey} readOnly className="input-field" />
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">What looks wrong?</label>
        <textarea id="message" required minLength={12} value={message} onChange={(e) => setMessage(e.target.value)} className="input-field min-h-32" />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">Email (optional)</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
      </div>
      <button type="submit" className="btn-primary">Send report</button>
      {status === 'sent' && <p role="status" className="text-sm text-success">Saved for review.</p>}
      {status === 'error' && <p role="alert" className="text-sm text-destructive">{detail}</p>}
    </form>
  );
}
