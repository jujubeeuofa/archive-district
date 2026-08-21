import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ItemStatus, OrderStatus, TenderType } from "@/lib/enums";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * POST /api/checkout { itemId }
 *
 * Creates a pending Order + OrderItem for the given in-stock item, then:
 *  - If STRIPE_SECRET_KEY is set, creates a real Stripe Checkout Session
 *    and returns its URL for redirect.
 *  - If not, this is the DEMO FALLBACK: the order is marked PAID
 *    immediately (no Stripe call) and the item is marked SOLD, so the full
 *    purchase flow works with zero external setup. See README for how to
 *    switch to live Stripe.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to buy." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  if (!itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.status !== ItemStatus.IN_STOCK) {
    return NextResponse.json({ error: "Item is not available for purchase." }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      status: OrderStatus.PENDING,
      subtotal: item.listPrice,
      total: item.listPrice,
      tenderType: TenderType.CARD,
      items: { create: [{ itemId: item.id, priceAtSale: item.listPrice }] },
    },
  });

  if (!stripeConfigured()) {
    // --- DEMO FALLBACK: no Stripe key set, mark paid immediately. ---
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, stripeSessionId: `demo_${order.id}` },
      }),
      prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD, soldPrice: item.listPrice } }),
    ]);

    return NextResponse.json({
      url: `/account/orders/${order.id}?demo=1`,
      demo: true,
    });
  }

  try {
    const stripe = getStripe();
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.listPrice * 100),
            product_data: {
              name: `${item.brand} — ${item.title}`,
              description: item.description?.slice(0, 500),
            },
          },
        },
      ],
      success_url: `${origin}/account/orders/${order.id}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/${item.id}?canceled=1`,
      metadata: { orderId: order.id, itemId: item.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Stripe checkout failed. Check server logs / STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }
}
