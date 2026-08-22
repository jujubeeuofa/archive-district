import { Role } from "@/lib/enums";

/**
 * Single source of truth for what each staff role can do, so the rule lives
 * in one place instead of scattered `role === "ADMIN"` checks. Two staff
 * tiers today (ADMIN, SALES) — CLIENT is a storefront customer, never
 * staff, and never passed in here.
 *
 * The shape of the rules (from the shop's own requirements):
 *   - SALES can run day-to-day operations across every back-office section
 *     (inventory, orders, submissions, vendors, consignments, reports,
 *     clients, appointments).
 *   - SALES can never delete anything.
 *   - SALES can never see item cost price or margin.
 *   - SALES can prepare a consignment agreement (draft terms) but can't
 *     commit the shop to it (send/void/mark paid) — that needs an Admin.
 *   - Staff account management and appointment-hours configuration are
 *     Admin-only.
 */
export function isStaff(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SALES;
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Cost price / margin on inventory items — Admin only, everywhere it appears. */
export function canSeeCost(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Delete/void-style destructive actions — Admin only. */
export function canDelete(role: Role): boolean {
  return role === Role.ADMIN;
}

/**
 * Committing the shop to a consignment deal: sending it, voiding it, or
 * marking a payout paid. Sales can still create/edit the DRAFT terms.
 */
export function canFinalizeConsignment(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Manual store-credit ledger adjustments — Admin only. */
export function canAdjustCredit(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Creating/deactivating staff accounts, and changing showroom hours. */
export function canManageStaffAndSettings(role: Role): boolean {
  return role === Role.ADMIN;
}
