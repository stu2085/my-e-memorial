import { parseGa4Context } from './ga4-purchase';
export function ga4ServerReportingEnabled(): boolean {
  return process.env.VERCEL_ENV === 'production' &&
    process.env.GA4_SERVER_PURCHASES_ENABLED === 'true' && Boolean(process.env.GA4_API_SECRET) && Boolean(process.env.STRIPE_ANALYTICS_WEBHOOK_SECRET);
}
export function checkoutGa4Metadata(req: Request, context: unknown): Record<string, string> {
  const url = new URL(req.url);
  const liveOrigin = url.protocol === 'https:' && ['myememorial.com', 'www.myememorial.com'].includes(url.hostname);
  const parsed = parseGa4Context(context);
  if (!ga4ServerReportingEnabled() || !liveOrigin || !parsed) return {};
  return { ga4_owner: 'server', ga4_client_id: parsed.clientId, ...(parsed.sessionId ? { ga4_session_id: parsed.sessionId } : {}) };
}
