import type { TenderType } from "@/lib/enums";

/**
 * A pluggable online-checkout payment provider. `/api/checkout` picks one of
 * these based on `PAYMENT_PROVIDER` (see src/lib/payments/index.ts) instead
 * of calling Stripe directly, so a second processor (US Bank's merchant
 * services, once the account/API details are final — see
 * src/lib/payments/usBankOnline.ts) can be dropped in without touching the
 * checkout route's order-creation/credit-application logic.
 */
export interface OnlinePaymentProvider {
  /** Which TenderType a successful checkout through this provider is recorded as. */
  readonly tenderType: TenderType;

  /** Whether this provider has everything it needs (API keys, etc.) to actually run. */
  isConfigured(): boolean;

  /**
   * Start a hosted checkout for the given order. Return `null` (rather than
   * throwing) if the provider can't currently process the charge — the
   * caller falls back to demo-checkout (order marked paid immediately, no
   * real charge) the same way an unconfigured Stripe key does today.
   */
  createCheckoutSession(params: {
    orderId: string;
    /** Amount to charge, in dollars (already net of any trade-in credit applied). */
    amount: number;
    description: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ redirectUrl: string; providerRef: string } | null>;
}
