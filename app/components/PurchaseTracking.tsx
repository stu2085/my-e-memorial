"use client";
import { isProductionTrackingAllowed } from "../../lib/tracking-environment";
import { useEffect } from 'react';
import { flushPendingPurchases, PURCHASE_READY_EVENT } from '../../lib/purchase-tracking';

export default function PurchaseTracking() {
  useEffect(() => {
    if (!isProductionTrackingAllowed()) return;
    const flush = () => flushPendingPurchases();
    const scriptLoaded = () => { queueMicrotask(flush); };
    flush();
    const interval = window.setInterval(flush, 500);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 120000);
    window.addEventListener(PURCHASE_READY_EVENT, flush);
    window.addEventListener('storage', flush);
    document.addEventListener('visibilitychange', flush);
    document.addEventListener('load', scriptLoaded, true);
    return () => {
      window.clearInterval(interval); window.clearTimeout(timeout);
      window.removeEventListener(PURCHASE_READY_EVENT, flush);
      window.removeEventListener('storage', flush);
      document.removeEventListener('visibilitychange', flush);
      document.removeEventListener('load', scriptLoaded, true);
    };
  }, []);
  return null;
}
