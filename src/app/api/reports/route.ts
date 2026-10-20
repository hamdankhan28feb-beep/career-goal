import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'report');
  if (limited) return limited;

  let body: { page_path?: string; entity_id?: string; field_key?: string; message?: string; contact_email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = (body.message || '').trim();
  if (message.length < 12 || message.length > 4000) {
    return NextResponse.json({ error: 'Describe the problem in 12 to 4000 characters.' }, { status: 400 });
  }
  const email = (body.contact_email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email is not usable.' }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Reports cannot be saved on this server yet. The form is here so the correction path exists once a database is configured.' },
      { status: 503 },
    );
  }

  try {
    await query(
      `INSERT INTO content_reports (page_path, entity_type, entity_id, field_key, message, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        (body.page_path || '').slice(0, 300),
        'university',
        (body.entity_id || '').slice(0, 200),
        (body.field_key || '').slice(0, 200),
        message,
        email || null,
      ],
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('content report failed', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'The report could not be saved.' }, { status: 500 });
  }
}
