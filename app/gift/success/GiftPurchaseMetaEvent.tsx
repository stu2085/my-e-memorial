"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type GiftPurchaseMetaEventProps = {
  sessionId: string;
  value: number;
  currency: string;
  plan?: string | null;
  giftType?: string | null;
};

export default function GiftPurchaseMetaEvent({
  sessionId,
  value,
  currency,
  plan,
  giftType,
}: GiftPurchaseMetaEventProps) {
  useEffect(() => {
    const storageKey = `myememorial_meta_purchase_${sessionId}`;

    try {
      if (window.localStorage.getItem(storageKey) === "sent") {
        return;
      }
    } catch {
      // If localStorage is unavailable, continue and still attempt to send the event.
    }

    let attempts = 0;
    const maxAttempts = 20;

    const sendPurchase = () => {
      attempts += 1;

      if (typeof window.fbq === "function") {
        window.fbq(
          "track",
          "Purchase",
          {
            value,
            currency,
            content_name: plan ? `${plan} MyEMemorial Gift` : "MyEMemorial Gift",
            content_category: giftType ? `${giftType} gift` : "gift",
          },
          {
            eventID: `gift_${sessionId}`,
          }
        );

        try {
          window.localStorage.setItem(storageKey, "sent");
        } catch {
          // The Meta event has already been sent; storage failure should not block the page.
        }

        return;
      }

      if (attempts < maxAttempts) {
        window.setTimeout(sendPurchase, 250);
      }
    };

    sendPurchase();
  }, [currency, giftType, plan, sessionId, value]);

  return null;
}
