/**
 * Transactional email via Resend's plain HTTP API (https://resend.com) — no
 * SDK dependency, just a fetch call, same "no-op gracefully if unconfigured"
 * shape as push.ts (VAPID) and visionMatch.ts (Google Vision).
 *
 * To turn this on: sign up for Resend, verify a sending domain (or use
 * their shared onboarding domain for testing), and set two env vars in
 * Vercel — RESEND_API_KEY and EMAIL_FROM (e.g.
 * `EMAIL_FROM="Archive District <appointments@archivedistrictaz.com>"`).
 * Until both are set, sendEmail() silently does nothing — nothing else in
 * the app depends on email actually going out.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!emailConfigured()) return;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Email send failed (${res.status}): ${body.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

/** Minimal HTML-escaping for user-supplied text (e.g. an appointment note) dropped into an email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
