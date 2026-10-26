import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transporter } from '../../../lib/email';
import { dueStage, eligible, reminderMessage, type Candidate } from '../../../../lib/memory-reminder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.VERCEL_ENV !== 'production' || process.env.MEMORY_REMINDERS_ENABLED !== 'true') return NextResponse.json({ enabled: false });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return NextResponse.json({ error: 'Configuration missing' }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = Date.now(); let lastId = 0, sent = 0, failed = 0;
  for (;;) {
    const batch = await db.from('memorials').select('id,owner_id,created_at,is_living_preplan,is_published,needs_review').eq('is_living_preplan', false).lte('created_at', new Date(now - 30 * 86400000).toISOString()).gt('id', lastId).order('id').limit(100);
    if (batch.error) return NextResponse.json({ error: 'Could not load memorials', sent, failed }, { status: 500 });
    const rows = (batch.data || []) as Candidate[];
    if (!rows.length) break;
    for (const m of rows) {
      lastId = m.id;
      if (!eligible(m, now)) continue;
      const prior = await db.from('memory_reminder_deliveries').select('stage,status').eq('memorial_id', m.id);
      if (prior.error) { failed++; continue; }
      const stage = dueStage(m, now);
      if (prior.data?.some(x => x.status === 'sending' || x.status === 'failed')) continue;
      if (!stage || prior.data?.some(x => x.stage === stage)) continue;
      const claim = await db.from('memory_reminder_deliveries').insert({ memorial_id: m.id, stage, status: 'sending' });
      if (claim.error) { if (claim.error.code !== '23505') failed++; continue; }
      const finish = async (status: 'sent'|'failed'|'skipped') => {
        const result = await db.from('memory_reminder_deliveries').update({ status, updated_at: new Date().toISOString() }).eq('memorial_id', m.id).eq('stage', stage).eq('status', 'sending');
        if (result.error) throw new Error('Could not update reminder status');
      };
      try {
        const fresh = await db.from('memorials').select('id,owner_id,created_at,is_living_preplan,is_published,needs_review').eq('id', m.id).maybeSingle();
        if (fresh.error) throw new Error('Could not recheck memorial');
        if (!fresh.data || !eligible(fresh.data as Candidate, now) || fresh.data.owner_id !== m.owner_id) { await finish('skipped'); continue; }
        const owner = await db.auth.admin.getUserById(m.owner_id!);
        if (owner.error || !owner.data.user?.email) throw new Error('Owner email unavailable');
        const content = reminderMessage();
        await transporter.sendMail({ from: '"MyEMemorial" <info@myememorial.com>', to: owner.data.user.email, ...content });
        await finish('sent'); sent++;
      } catch {
        failed++;
        // Do not retry automatically: SMTP or the database might have accepted the message.
        try { await finish('failed'); } catch { /* Leave the durable claim for review. */ }
      }
    }
    if (rows.length < 100) break;
  }
  return NextResponse.json({ enabled: true, sent, failed });
}
