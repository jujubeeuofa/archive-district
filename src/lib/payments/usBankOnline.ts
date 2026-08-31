import { TenderType } from "@/lib/enums";
import type { OnlinePaymentProvider } from "./types";

/**
 * Scaffold for US Bank's merchant-services online/web checkout — put here
 * ahead of the real account being opened, mirroring how the US_BANK
 * "walk-in sale" tender (src/app/admin/orders/actions.ts) was scaffolded
 * before that account existed either.
 *
 * U.S. Bank's merchant services are typically white-labeled from a
 * third-party processor (commonly Elavon, since U.S. Bank owns them, but it
 * depends on the specific plan) rather than a single "US Bank API" — so
 * there isn't yet a concrete gateway to integrate against. Once the account
 * is open and the processor + API docs are known:
 *
 *   1. Add that processor's SDK (or plain fetch calls, matching this app's
 *      existing no-SDK style — see src/lib/sms.ts / src/lib/email.ts) here.
 *   2. Add its required env vars below to isConfigured() and .env.example
 *      (e.g. a merchant ID + API key/secret; exact names depend on which
 *      processor it turns out to be).
 *   3. Implement createCheckoutSession() to actually create a hosted
 *      checkout / payment session and return its redirect URL.
 *   4. If the processor confirms payment via webhook (most do), add a
 *      route under src/app/api/webhooks/ that calls
 *      markOrderPaidAndFulfill(orderId) — same pattern as
 *      src/app/api/webhooks/stripe/route.ts.
 *
 * Until then, this always reports itself unconfigured, so selecting it via
 * PAYMENT_PROVIDER=us_bank in .env is safe to do ahead of time: /api/checkout
 * falls back to the same demo-checkout behavior as an unset Stripe key
 * (order marked paid immediately, no real charge), just tagged with
 * tenderType US_BANK instead of CARD — useful for exercising the UI/ledger
 * side of "online orders paid via US Bank" before the real integration
 * exists.
 */
export function usBankOnlineConfigured(): boolean {
  // No US Bank / processor env vars exist yet — always false until step 2 above.
  return false;
}

export const usBankOnlineProvider: OnlinePaymentProvider = {
  tenderType: TenderType.US_BANK,
  isConfigured: usBankOnlineConfigured,
  async createCheckoutSession() {
    // Not implemented yet — see file header. Returning null tells the
    // caller to fall back to demo-checkout rather than erroring the buyer's
    // checkout.
    console.error(
      "PAYMENT_PROVIDER=us_bank but the US Bank online checkout integration " +
        "isn't implemented yet (src/lib/payments/usBankOnline.ts) — falling back to demo checkout."
    );
    return null;
  },
};
