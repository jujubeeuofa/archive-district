import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/enums";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { markOrderPaidAndFulfill } from "@/lib/orderFulfillment";
import type Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 *
 * Optional: only relevant once you're on real Stripe (STRIPE_SECRET_KEY set)
 * and have registered this endpoint's public URL + STRIPE_WEBHOOK_SECRET in
 * the Stripe dashboard. The order-detail page also reconciles payment status
 * directly via the Checkout Session on load, so this webhook is a
 * production hardening step, not required for the demo to work.
 */
export async function POST(req: NextRequest) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, note: "Webhook not configured; no-op." });
  }

  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig || "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && order.status !== OrderStatus.PAID) {
        await markOrderPaidAndFulfill(orderId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
