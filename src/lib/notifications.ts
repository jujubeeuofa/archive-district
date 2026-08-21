import { prisma } from "@/lib/prisma";
import { sendPushToSubscription, vapidConfigured, type PushPayload } from "@/lib/push";
import type { Item } from "@prisma/client";

/**
 * Pushes a "new item" notification to every client who has opted into
 * notifyNewItems and has at least one saved PushSubscription. No-ops
 * quietly if VAPID isn't configured — same graceful-degrade behavior as
 * the rest of the push stack (see lib/push.ts).
 *
 * Mirrors the cleanup logic in api/push/send/route.ts: a subscription that
 * the push service reports as gone (404/410) is deleted so it stops being
 * retried on every future item.
 */
export async function notifyNewItemSubscribers(item: Pick<Item, "id" | "title" | "brand">) {
  if (!vapidConfigured()) return;

  const subscribers = await prisma.user.findMany({
    where: { notifyNewItems: true, pushSubscriptions: { some: {} } },
    include: { pushSubscriptions: true },
  });
  if (subscribers.length === 0) return;

  const payload: PushPayload = {
    title: "New arrival at Archive District",
    body: `${item.brand} — ${item.title}`,
    url: `/shop/${item.id}`,
  };

  const subscriptions = subscribers.flatMap((u) => u.pushSubscriptions);

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
      }
    }
  }
}
