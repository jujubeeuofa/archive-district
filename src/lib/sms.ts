/**
 * Transactional SMS via Twilio's plain REST API — no SDK dependency, just a
 * fetch call, same "no-op gracefully if unconfigured" shape as email.ts
 * (Resend), push.ts (VAPID), and visionMatch.ts (Google Vision).
 *
 * To turn this on: create a Twilio account (twilio.com), buy or provision a
 * phone number capable of sending SMS, and set three env vars in Vercel —
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER (in E.164
 * format, e.g. "+16025551234"). Billed per message by Twilio — not free,
 * unlike email via the shared/dev tiers of most providers. Until all three
 * are set, sendSms() silently does nothing — nothing else in the app
 * depends on SMS actually going out.
 */

function twilioApiUrl(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

export function smsConfigured(): boolean {
  return (
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms({ to, body }: { to: string; body: string }): Promise<void> {
  if (!smsConfigured()) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_FROM_NUMBER as string;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(twilioApiUrl(accountSid), {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`SMS send failed (${res.status}): ${errBody.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}
