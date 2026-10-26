import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { ga4ServerReportingEnabled } from '../../../lib/ga4-server-config';
import { deliverGa4Purchase } from '../../../lib/ga4-delivery';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const origin = new URL(req.url);
  const isLiveOrigin = origin.protocol === 'https:' && ['myememorial.com', 'www.myememorial.com'].includes(origin.hostname);
  if (!isLiveOrigin || !ga4ServerReportingEnabled()) return NextResponse.json({ error: 'Analytics delivery is not enabled.' }, { status: 503 });
  const secret = process.env.STRIPE_ANALYTICS_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !stripeKey || !supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Analytics delivery is not configured.' }, { status: 503 });
  let event: Stripe.Event;
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
    event = new Stripe(stripeKey).webhooks.constructEvent(await req.text(), signature, secret);
  } catch { return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 }); }
  if (!event.livemode || !['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return NextResponse.json({ received: true, result: 'ignored' });
  try {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const result = await deliverGa4Purchase(admin, event.data.object as Stripe.Checkout.Session, event.id, event.created, process.env.GA4_API_SECRET!);
    console.info('GA4 analytics webhook:', { eventId: event.id, result });
    return NextResponse.json({ received: true, result });
  } catch (error) {
    // Stripe retries THIS endpoint independently; existing fulfillment is untouched.
    console.error('GA4 analytics webhook failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Analytics delivery should be retried.' }, { status: 500 });
  }
}
