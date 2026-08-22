export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(d);
}

/** Margin = sale price (sold, else list) minus cost. */
export function computeMargin(costPrice: number, listPrice: number, soldPrice?: number | null) {
  const basis = soldPrice ?? listPrice;
  const margin = basis - costPrice;
  const marginPct = costPrice > 0 ? (margin / costPrice) * 100 : 0;
  return { margin, marginPct, basis };
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "IN_STOCK":
    case "PAID":
    case "ACCEPTED":
    case "AUTHENTICATED":
    case "SIGNED":
    case "CONFIRMED":
    case "COMPLETED":
      return "bg-emerald-900/40 text-emerald-300 border-emerald-700";
    case "SOLD":
      return "bg-accent/20 text-accent-light border-accent-dark";
    case "HELD":
    case "PENDING":
    case "IN_REVIEW":
    case "SUBMITTED":
    case "UNVERIFIED":
      return "bg-amber-900/40 text-amber-300 border-amber-700";
    case "PENDING_INTAKE":
    case "OFFER_MADE":
    case "SENT":
      return "bg-sky-900/40 text-sky-300 border-sky-700";
    case "DECLINED":
    case "CANCELED":
    case "REFUNDED":
    case "FLAGGED":
    case "VOIDED":
    case "NO_SHOW":
      return "bg-red-900/40 text-red-300 border-red-700";
    default:
      return "bg-ink-700 text-ink-300 border-ink-600";
  }
}
