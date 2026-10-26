import { isProductionTrackingAllowed } from "./tracking-environment";

// Only server-verified transaction details are retained; never store form contents here.
const PENDING_PREFIX = 'myememorial:pending-purchase:';
const SENT_PREFIX = 'myememorial:processed-purchase:';
export const PURCHASE_READY_EVENT = 'myememorial:verified-purchase';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
type Channel = 'ga4' | 'google-ads' | 'microsoft' | 'meta';
type Purchase = {
  transactionId: string; value: number; currency: string;
  plan: 'basic' | 'plus' | 'premium'; memorialType: 'living' | 'departed'; createdAt: number;
};
type TrackingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  uetq?: unknown[] | { push: (...args: unknown[]) => unknown };
  fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown };
};
const pending = new Map<string, Purchase>();
const queued = new Set<string>();
const completed = new Set<string>();
let googleConfigured = false;
function stores(): Storage[] {
  const result: Storage[] = [];
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try { result.push(window[name]); } catch { /* Browser storage may be blocked. */ }
  }
  return result;
}
function read(key: string): string | null {
  for (const storage of stores()) {
    try { const value = storage.getItem(key); if (value !== null) return value; } catch { /* Try the other store. */ }
  }
  return null;
}
function write(key: string, value: string) {
  for (const storage of stores()) {
    try { storage.setItem(key, value); } catch { /* In-memory handling still works in this document. */ }
  }
}
function remove(key: string) {
  for (const storage of stores()) { try { storage.removeItem(key); } catch { /* Optional storage. */ } }
}
function channelKey(purchase: Purchase, channel: Channel) { return `${SENT_PREFIX}${channel}:${purchase.transactionId}`; }
function done(purchase: Purchase, channel: Channel) {
  const key = channelKey(purchase, channel);
  return completed.has(key) || read(key) !== null;
}
function mark(purchase: Purchase, channel: Channel) {
  const key = channelKey(purchase, channel);
  completed.add(key); write(key, String(Date.now()));
}
function validPurchase(value: unknown): value is Purchase {
  if (!value || typeof value !== 'object') return false;
  const p = value as Purchase;
  return typeof p.transactionId === 'string' && p.transactionId.length > 0 && p.transactionId.length <= 255 &&
    Number.isFinite(p.value) && p.value > 0 && typeof p.currency === 'string' && /^[A-Z]{3}$/.test(p.currency) &&
    ['basic', 'plus', 'premium'].includes(p.plan) && ['living', 'departed'].includes(p.memorialType) &&
    Number.isFinite(p.createdAt) && p.createdAt <= Date.now() && Date.now() - p.createdAt < MAX_AGE;
}
export function rememberVerifiedPurchase(result: Record<string, unknown>, memorialType: 'living' | 'departed') {
  if (!isProductionTrackingAllowed() || result.paid !== true || result.livemode !== true || result.checkoutType !== 'standard') return;
  const purchase = {
    transactionId: result.transactionId, value: Number(result.conversionValue),
    currency: String(result.conversionCurrency || '').toUpperCase(), plan: result.plan,
    memorialType, createdAt: Date.now(),
  };
  if (!validPurchase(purchase)) return;
  const key = PENDING_PREFIX + purchase.transactionId;
  const existing = read(key);
  if (existing) {
    try { const value: unknown = JSON.parse(existing); if (validPurchase(value)) purchase.createdAt = value.createdAt; } catch { /* Replace invalid pending data. */ }
  }
  if (result.ga4Owner === "server") mark(purchase, "ga4");
  pending.set(purchase.transactionId, purchase);
  write(key, JSON.stringify(purchase));
  window.dispatchEvent(new Event(PURCHASE_READY_EVENT));
}
function googleEvent(purchase: Purchase, channel: 'ga4' | 'google-ads', event: string, params: Record<string, unknown>) {
  if (!isProductionTrackingAllowed()) return;
  const key = channelKey(purchase, channel);
  if (done(purchase, channel) || queued.has(key)) return;
  const target = window as TrackingWindow;
  // The initialization command must precede ecommerce events in Google's queue.
  googleConfigured ||= Boolean(target.dataLayer?.some(command => {
    if (!command || typeof command !== 'object') return false;
    const args = command as ArrayLike<unknown>;
    return args[0] === 'config' && args[1] === 'G-SLX50BGDQK';
  }));
  if (!googleConfigured) return;
  queued.add(key);
  const details = { ...params, transport_type: 'beacon', event_callback: () => mark(purchase, channel) };
  try {
    if (typeof target.gtag === 'function') target.gtag('event', event, details);
    else {
      target.dataLayer = target.dataLayer || [];
      // Match Google's Arguments-object queue. Keep pending storage until its callback runs.
      // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
      const command = function (..._args: unknown[]) { target.dataLayer!.push(arguments); };
      command('event', event, details);
    }
  } catch { queued.delete(key); }
}
export function flushPendingPurchases() {
  if (!isProductionTrackingAllowed()) return;
  for (const storage of stores()) {
    try {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (!key?.startsWith(PENDING_PREFIX)) continue;
        try {
          const value: unknown = JSON.parse(storage.getItem(key) || 'null');
          if (validPurchase(value)) pending.set(value.transactionId, value);
          else remove(key);
        } catch { remove(key); }
      }
    } catch { /* The in-memory queue remains usable. */ }
  }
  const target = window as TrackingWindow;
  for (const purchase of pending.values()) {
    if (Date.now() - purchase.createdAt >= MAX_AGE) { pending.delete(purchase.transactionId); remove(PENDING_PREFIX + purchase.transactionId); continue; }
    const context = { plan: purchase.plan, memorial_type: purchase.memorialType };
    googleEvent(purchase, 'ga4', 'purchase', {
      ...context, transaction_id: purchase.transactionId, value: purchase.value, currency: purchase.currency,
      items: [{ item_id: purchase.plan, item_name: `${purchase.plan} MyEMemorial`, price: purchase.value, quantity: 1 }],
    });
    googleEvent(purchase, 'google-ads', 'conversion', {
      send_to: 'AW-18425931513/S-_aCO006-wcEPnNldJE', transaction_id: purchase.transactionId,
      value: purchase.value, currency: purchase.currency,
    });
    // An Array is only the pre-load queue. Wait for the UET runtime before marking it processed.
    if (!done(purchase, 'microsoft') && target.uetq && !Array.isArray(target.uetq) && typeof target.uetq.push === 'function') {
      try {
        target.uetq.push('event', 'purchase', { revenue_value: purchase.value, currency: purchase.currency });
        mark(purchase, 'microsoft');
      } catch { /* Retain pending data for the next attempt. */ }
    }
    const needsMeta = Boolean(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
    if (needsMeta && !done(purchase, 'meta') && typeof target.fbq === 'function' && typeof target.fbq.callMethod === 'function') {
      try {
        target.fbq('track', 'Purchase', { value: purchase.value, currency: purchase.currency, content_name: purchase.plan }, { eventID: `memorial_${purchase.transactionId}` });
        mark(purchase, 'meta');
      } catch { /* Retry when the runtime is available. */ }
    }
    if (done(purchase, 'ga4') && done(purchase, 'google-ads') && done(purchase, 'microsoft') && (!needsMeta || done(purchase, 'meta'))) {
      pending.delete(purchase.transactionId); remove(PENDING_PREFIX + purchase.transactionId);
    }
  }
}
