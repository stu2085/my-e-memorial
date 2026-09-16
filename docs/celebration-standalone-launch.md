# Standalone Celebration of Life Presentation launch

Customer offer: one-time **$29.95**, 60 days of hosted presentation access, plus a **single-use $29.95 credit** toward a new Basic, Plus, or Premium MyEMemorial. Paid MyEMemorial plans continue to include their separate Celebration of Life Presentation at no additional charge.

## Required setup

1. Apply `supabase/migrations/20260915_celebration_email_access.sql` to the same Supabase project as the existing presentation schema. The email-access and credit columns must exist before the new webhook runs.
2. In **Stripe test mode**, create an active product named `Standalone Celebration of Life Presentation` with an active, one-time **USD $29.95** price. Copy its `price_...` ID into `STRIPE_CELEBRATION_PRICE_ID` in the local test environment. Existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and Office 365 mail settings are also required.
3. Confirm the existing Stripe webhook endpoint receives `checkout.session.completed` and `charge.refunded`. Automatic tax is enabled for the standalone purchase, as it is for memorial purchases.
4. Test a fresh draft: create and preview, open Checkout, cancel and retry, pay with a Stripe test card, return to the builder, wait for `paymentStatus: paid`, open the emailed link from a second device, play the public URL, and redeem the single-use credit code on a new Basic/Plus/Premium plan. Check tax and the $29.95 discount on the Stripe receipt. Try the credit again to confirm Stripe rejects a second use.
5. Test the purchaser access-request form after removing the edit cookie. Check that it emails only the purchaser and that the old email link stops working after a new one is requested. Test a full refund: public playback stops and an unused credit code becomes inactive.
6. Create the same Stripe product/one-time $29.95 price **in live mode**; set the production Vercel `STRIPE_CELEBRATION_PRICE_ID` to its live `price_...` ID. Test and live price IDs are different. Deploy the reviewed commit after the migration and env var are in place, then perform a small real purchase and confirm the receipt, credit, private edit link, public playback, and iPhone/fullscreen behavior.

`NEXT_PUBLIC_SITE_URL` must be the production origin used in Checkout redirects and purchaser emails. The application verifies the configured Stripe price is active, one-time, USD, and 2995 cents. Without this setting the purchase button returns a service-unavailable message.

The customer edit cookie lasts 60 days after an email link is redeemed. Purchasers may request a fresh single-use email link until hosting expires, with a five-minute cooldown. After expiration the public API no longer serves the player even if the lifecycle status has not yet been updated by a scheduled job.
