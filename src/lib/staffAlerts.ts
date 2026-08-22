import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import { sendEmail, emailConfigured, escapeHtml } from "@/lib/email";
import { sendSms, smsConfigured } from "@/lib/sms";

/**
 * Notifies every active staff member (Admin or Sales) who has opted into
 * email and/or SMS alerts, whenever a client books an appointment, submits
 * something to sell, or completes a purchase — the three events called out
 * in the shop's requirements. Each staff member's own staffNotifyEmail /
 * staffNotifySms toggle (set via /admin, self-service) decides which
 * channel(s), if any, they get; SMS additionally requires a phone number on
 * file. Both channels no-op quietly if unconfigured (see email.ts / sms.ts)
 * — this never blocks or throws on the action that triggered it, so
 * callers should still wrap the call in .catch() the same way
 * sendAppointmentConfirmationEmail already is.
 */
export async function notifyStaffOfEvent({
  subject,
  emailHtml,
  smsBody,
}: {
  /** Email subject line. */
  subject: string;
  /** Full HTML email body. */
  emailHtml: string;
  /** Short plain-text SMS body — keep this to a sentence or two. */
  smsBody: string;
}): Promise<void> {
  if (!emailConfigured() && !smsConfigured()) return;

  const staff = await prisma.user.findMany({
    where: {
      role: { in: [Role.ADMIN, Role.SALES] },
      active: true,
      OR: [{ staffNotifyEmail: true }, { staffNotifySms: true }],
    },
    select: { email: true, phone: true, staffNotifyEmail: true, staffNotifySms: true },
  });

  const tasks: Promise<void>[] = [];
  for (const member of staff) {
    if (member.staffNotifyEmail && emailConfigured()) {
      tasks.push(sendEmail({ to: member.email, subject, html: emailHtml }));
    }
    if (member.staffNotifySms && smsConfigured() && member.phone) {
      tasks.push(sendSms({ to: member.phone, body: smsBody }));
    }
  }

  await Promise.allSettled(tasks);
}

/** Fires when a client books a showroom appointment. */
export async function notifyStaffOfBooking(client: { name: string }, whenPhoenix: string) {
  await notifyStaffOfEvent({
    subject: "New showroom appointment booked",
    emailHtml: `
      <p><strong>${escapeHtml(client.name)}</strong> just booked a showroom visit for <strong>${escapeHtml(whenPhoenix)}</strong> (Phoenix time).</p>
      <p>See it in the admin: /admin/appointments</p>
    `,
    smsBody: `Archive District: ${client.name} booked a showroom visit for ${whenPhoenix}.`,
  });
}

/** Fires when a client submits an item to sell. */
export async function notifyStaffOfSubmission(
  client: { name: string },
  submission: { id: string; brand: string; title: string; askingPrice: number | null }
) {
  const priceLine = submission.askingPrice != null ? ` — asking $${submission.askingPrice.toFixed(2)}` : "";
  await notifyStaffOfEvent({
    subject: "New sell submission",
    emailHtml: `
      <p><strong>${escapeHtml(client.name)}</strong> submitted an item to sell: <strong>${escapeHtml(submission.brand)} — ${escapeHtml(submission.title)}</strong>${priceLine ? escapeHtml(priceLine) : ""}.</p>
      <p>Review it in the admin: /admin/submissions/${submission.id}</p>
    `,
    smsBody: `Archive District: ${client.name} submitted ${submission.brand} — ${submission.title} to sell${priceLine}.`,
  });
}

/** Fires when an order is marked paid (a completed purchase). */
export async function notifyStaffOfPurchase(
  buyer: { name: string },
  order: { id: string; total: number }
) {
  await notifyStaffOfEvent({
    subject: "New purchase",
    emailHtml: `
      <p><strong>${escapeHtml(buyer.name)}</strong> just completed a purchase totaling <strong>$${order.total.toFixed(2)}</strong>.</p>
      <p>See it in the admin: /admin/orders/${order.id}</p>
    `,
    smsBody: `Archive District: ${buyer.name} bought $${order.total.toFixed(2)} — order ${order.id.slice(0, 8)}.`,
  });
}
