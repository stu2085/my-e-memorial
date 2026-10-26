// Pure payload construction. No customer names, emails, or memorial content.
export const GA4_MEASUREMENT_ID = 'G-SLX50BGDQK';
export type Ga4Context = { clientId: string; sessionId?: string };
export type PaidCheckout = {
  id: string; livemode: boolean; payment_status: string;
  amount_total: number | null; currency: string | null;
  total_details?: { amount_tax: number | null } | null;
  metadata: Record<string, string> | null;
};
export function parseGa4Context(value: unknown): Ga4Context | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const clientId = typeof data.clientId === 'string' ? data.clientId : '';
  // Accept only the numeric GA web-client identifier, never arbitrary text/PII.
  if (!/^\d{1,20}\.\d{1,20}$/.test(clientId)) return null;
  const sessionId = typeof data.sessionId === 'string' && /^\d{1,16}$/.test(data.sessionId)
    ? data.sessionId : undefined;
  return { clientId, ...(sessionId ? { sessionId } : {}) };
}
export function buildGa4Purchase(session: PaidCheckout, paidAtSeconds: number) {
  const m = session.metadata || {};
  if (!session.livemode || session.payment_status !== 'paid' || !session.id.startsWith('cs_live_')) return null;
  const type = m.checkoutType || m.type || 'standard';
  const standard = type === 'standard' && ['basic', 'plus', 'premium'].includes(m.plan);
  const presentation = type === 'celebration_presentation';
  if (!standard && !presentation) return null;
  const total = session.amount_total, tax = session.total_details?.amount_tax ?? 0;
  if (!Number.isSafeInteger(total) || total! <= 0 || !Number.isSafeInteger(tax) || tax < 0 || tax > total!) return null;
  if (!session.currency || !/^[a-zA-Z]{3}$/.test(session.currency) || !Number.isSafeInteger(paidAtSeconds) || paidAtSeconds <= 0) return null;
  const context = parseGa4Context({ clientId: m.ga4_client_id, sessionId: m.ga4_session_id });
  const value = (total! - tax) / 100;
  if (value <= 0) return null;
  const itemId = presentation ? 'celebration_presentation' : m.plan;
  const params = {
    transaction_id: session.id, value, currency: session.currency.toUpperCase(),
    ...(context?.sessionId ? { session_id: Number(context.sessionId) } : {}),
    engagement_time_msec: 1,
    ...(standard ? { plan: m.plan } : {}),
    product_type: presentation ? 'celebration_presentation' : 'memorial',
    items: [{ item_id: itemId, item_name: presentation ? 'Celebration of Life Presentation' : `${m.plan} MyEMemorial`, price: value, quantity: 1 }],
  };
  return {
    transactionId: session.id,
    owner: m.ga4_owner === 'server' ? 'server' : 'browser',
    context,
    payload: context ? { client_id: context.clientId, timestamp_micros: paidAtSeconds * 1000000, events: [{ name: 'purchase', params }] } : null,
    paidAt: new Date(paidAtSeconds * 1000).toISOString(),
  };
}
