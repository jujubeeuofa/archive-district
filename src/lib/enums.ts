// SQLite has no native enum type, so the Prisma schema stores these fields
// as String. These TS unions + const objects are the source of truth for
// valid values everywhere in the app (forms, server actions, seed data).

export const Role = { ADMIN: "ADMIN", CLIENT: "CLIENT" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ItemStatus = {
  IN_STOCK: "IN_STOCK",
  SOLD: "SOLD",
  HELD: "HELD",
  PENDING_INTAKE: "PENDING_INTAKE",
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const AuthenticityStatus = {
  UNVERIFIED: "UNVERIFIED",
  AUTHENTICATED: "AUTHENTICATED",
  FLAGGED: "FLAGGED",
} as const;
export type AuthenticityStatus = (typeof AuthenticityStatus)[keyof typeof AuthenticityStatus];

export const ItemSource = {
  PURCHASED: "PURCHASED",
  CONSIGNED: "CONSIGNED",
} as const;
export type ItemSource = (typeof ItemSource)[keyof typeof ItemSource];

/** A single filled-out checklist row, as stored in AuthenticityCheck.checklist (JSON). */
export type ChecklistEntry = {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
};

export const SubmissionStatus = {
  SUBMITTED: "SUBMITTED",
  IN_REVIEW: "IN_REVIEW",
  OFFER_MADE: "OFFER_MADE",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELED: "CANCELED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TenderType = {
  CARD: "CARD",
  CASH: "CASH",
  /// A sale processed through the US Bank merchant account — physical card
  /// terminal, iPhone app, or web API gateway all land here for now. Split
  /// into per-channel values later if reporting ever needs to tell them
  /// apart; today it's one processor relationship either way.
  US_BANK: "US_BANK",
  OTHER: "OTHER",
} as const;
export type TenderType = (typeof TenderType)[keyof typeof TenderType];

export const SubmissionPayoutType = {
  CASH: "CASH",
  STORE_CREDIT: "STORE_CREDIT",
} as const;
export type SubmissionPayoutType = (typeof SubmissionPayoutType)[keyof typeof SubmissionPayoutType];

export const CreditTransactionType = {
  EARNED: "EARNED",
  REDEEMED: "REDEEMED",
  ADJUSTED: "ADJUSTED",
} as const;
export type CreditTransactionType = (typeof CreditTransactionType)[keyof typeof CreditTransactionType];

export const ConsignmentStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  SIGNED: "SIGNED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
} as const;
export type ConsignmentStatus = (typeof ConsignmentStatus)[keyof typeof ConsignmentStatus];

export const ConsignmentPayoutStatus = {
  NOT_YET_SOLD: "NOT_YET_SOLD",
  OWED: "OWED",
  PAID: "PAID",
} as const;
export type ConsignmentPayoutStatus = (typeof ConsignmentPayoutStatus)[keyof typeof ConsignmentPayoutStatus];
