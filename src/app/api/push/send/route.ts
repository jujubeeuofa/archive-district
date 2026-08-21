import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendPushToSubscription, vapidConfigured } from "@/lib/push";

/**
 * POST /api/push/send { userId, title?, body? }
 * Admin-only. Sends a push notification to every saved subscription for
 * the given user (e.g. the "send test push" button on /admin/clients).
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  if (!vapidConfigured()) {
    return NextResponse.json(
      {
        error:
          "Push notifications are not configured on this server (missing VAPID keys). Run `npm run vapid:generate` and add the keys to .env.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "This user has no saved push subscriptions yet." },
      { status: 404 }
    );
  }

  const title = (body?.title as string) || "Archive District";
  const message = (body?.body as string) || "This is a test notification from Archive District.";

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushToSubscription(sub, { title, body: message, url: "/account" })
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  // Clean up subscriptions the push service reports as gone.
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    sent: results.length - failed.length,
    failed: failed.length,
  });
}
