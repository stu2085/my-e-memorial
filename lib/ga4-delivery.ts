import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildGa4Purchase, GA4_MEASUREMENT_ID, type PaidCheckout } from './ga4-purchase';

type Row = { transaction_id: string; status: string; paid_at: string; payload: Record<string, unknown> | null };
// Google HTTP acceptance is not proof of report ingestion. The status says exactly that.
export async function deliverGa4Purchase(admin: SupabaseClient, session: PaidCheckout, eventId: string, paidAt: number, secret: string, send: typeof fetch = fetch) {
  const purchase = buildGa4Purchase(session, paidAt);
  if (!purchase) return 'ineligible';
  const reason = purchase.owner !== 'server' ? 'browser_owned_or_legacy_checkout' : !purchase.context ? 'missing_client_id' : null;
  const inserted = await admin.from('ga4_purchase_deliveries').upsert({
    transaction_id: purchase.transactionId, stripe_event_id: eventId, paid_at: purchase.paidAt,
    payload: purchase.payload, status: reason ? 'skipped' : 'pending', reason,
  }, { onConflict: 'transaction_id', ignoreDuplicates: true });
  if (inserted.error) throw new Error('GA4 delivery record could not be persisted.');
  const lookup = await admin.from('ga4_purchase_deliveries').select('transaction_id,status,paid_at,payload').eq('transaction_id', purchase.transactionId).single();
  if (lookup.error || !lookup.data) throw new Error('GA4 delivery record could not be read.');
  const existing = lookup.data as Row;
  if (['skipped', 'http_accepted', 'expired', 'rejected'].includes(existing.status)) return existing.status;
  const lease = randomUUID();
  const claim = await admin.rpc('claim_ga4_purchase', { p_transaction_id: purchase.transactionId, p_lease_token: lease });
  if (claim.error) throw new Error('GA4 delivery could not be claimed.');
  const row = (claim.data as Row[] | null)?.[0];
  if (!row) throw new Error('GA4 delivery is already being handled. Retry later.');
  const finish = async (fields: Record<string, unknown>) => {
    const result = await admin.from('ga4_purchase_deliveries').update({ ...fields, lease_token: null, lease_until: null, updated_at: new Date().toISOString() })
      .eq('transaction_id', purchase.transactionId).eq('lease_token', lease);
    if (result.error) throw new Error('GA4 delivery state could not be saved.');
  };
  // Preserve original payment time; never turn an old retry into a new sale today.
  if (Date.now() - Date.parse(row.paid_at) > 48 * 60 * 60 * 1000) {
    await finish({ status: 'expired', reason: 'outside_48_hour_delivery_window' });
    return 'expired';
  }
  const url = new URL('https://www.google-analytics.com/mp/collect');
  url.searchParams.set('measurement_id', GA4_MEASUREMENT_ID); url.searchParams.set('api_secret', secret);
  let status: number;
  try {
    const response = await send(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row.payload), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
    status = response.status;
  } catch {
    await finish({ status: 'pending', reason: 'network_error_or_timeout' });
    throw new Error('GA4 request did not complete; Stripe should retry the analytics endpoint.');
  }
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    await finish({ status: 'rejected', reason: 'google_http_error_requires_review', last_http_status: status });
    return 'rejected';
  }
  if (status < 200 || status >= 300) {
    await finish({ status: 'pending', reason: 'google_http_error', last_http_status: status });
    throw new Error('GA4 HTTP request was rejected; analytics endpoint should retry.');
  }
  await finish({ status: 'http_accepted', reason: null, last_http_status: status });
  return 'http_accepted';
}
