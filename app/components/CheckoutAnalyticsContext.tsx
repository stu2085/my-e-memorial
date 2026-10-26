'use client';
import { useEffect } from 'react';
import { isProductionTrackingAllowed } from '../../lib/tracking-environment';
import { GA4_MEASUREMENT_ID, parseGa4Context } from '../../lib/ga4-purchase';

async function readContext() {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return null;
  const read = (field: string) => new Promise<unknown>(resolve => {
    const timer = window.setTimeout(() => resolve(undefined), 500);
    try { gtag('get', GA4_MEASUREMENT_ID, field, (value: unknown) => { window.clearTimeout(timer); resolve(value); }); }
    catch { window.clearTimeout(timer); resolve(undefined); }
  });
  const [clientId, sessionId] = await Promise.all([read('client_id'), read('session_id')]);
  return parseGa4Context({ clientId, sessionId: sessionId == null ? undefined : String(sessionId) });
}

// Adds only analytics identifiers to existing checkout requests. Never delays payment
// more than the bounded getter timeout; never reads memorial form contents.
export default function CheckoutAnalyticsContext() {
  useEffect(() => {
    if (!isProductionTrackingAllowed()) return;
    const previous = window.fetch;
    const wrapped: typeof window.fetch = async (input, init) => {
      try {
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.href);
        const checkout = url.pathname === '/api/checkout' || /^\/api\/celebration-presentations\/[^/]+\/checkout$/.test(url.pathname);
        if (url.origin === window.location.origin && checkout && init?.method?.toUpperCase() === 'POST') {
          const context = await readContext();
          if (context && (init.body == null || typeof init.body === 'string')) {
            const body = init.body ? JSON.parse(init.body as string) : {};
            if (body && typeof body === 'object' && !Array.isArray(body)) {
              const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json');
              return previous.call(window, input, { ...init, headers, body: JSON.stringify({ ...body, ga4Context: context }) });
            }
          }
        }
      } catch { /* Checkout must remain usable when identifiers cannot be read. */ }
      return previous.call(window, input, init);
    };
    window.fetch = wrapped;
    return () => { if (window.fetch === wrapped) window.fetch = previous; };
  }, []);
  return null;
}
