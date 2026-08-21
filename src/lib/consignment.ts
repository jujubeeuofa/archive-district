import crypto from "crypto";

/** Long random token for the public, no-login e-sign link. */
export function generateSignToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Consignor's payout on a sale, rounded to the cent. */
export function computeConsignorPayout(soldPrice: number, consignorSplitPct: number): number {
  return Math.round(soldPrice * (consignorSplitPct / 100) * 100) / 100;
}

/**
 * Default consignment contract text, filled in with this agreement's
 * specifics. Admin can edit the result before sending — this is just a
 * starting point, not a legal template vetted by a lawyer. Once signed, the
 * exact text shown is frozen in ConsignmentAgreement.contractSnapshot, so
 * editing this function later never changes an already-signed agreement.
 */
export function buildDefaultConsignmentContract(params: {
  consignorName: string;
  itemTitle: string;
  listPrice: number;
  floorPrice: number | null;
  consignorSplitPct: number;
}): string {
  const { consignorName, itemTitle, listPrice, floorPrice, consignorSplitPct } = params;
  const shopSplitPct = 100 - consignorSplitPct;
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return `CONSIGNMENT AGREEMENT

Between Archive District ("Consignee") and ${consignorName || "the Consignor"} ("Consignor"), regarding the following item:

  Item: ${itemTitle}
  Initial list price: ${money(listPrice)}
${floorPrice != null ? `  Floor price (will not sell below without Consignor's consent): ${money(floorPrice)}\n` : ""}
1. Consignor represents that they are the rightful owner of the item, that it is authentic, and that it is free of any liens or claims.

2. Consignee will list the item for sale at the price shown above and may adjust the price downward over time to facilitate a sale, but will not sell below the floor price (if one is set) without Consignor's written consent.

3. Upon sale, Consignor will receive ${consignorSplitPct}% of the final sale price. Consignee retains the remaining ${shopSplitPct}% as its commission.

4. Payout to Consignor will be issued within a reasonable time after the sale is finalized and any payment has cleared.

5. Consignee will use reasonable care in storing, photographing, and displaying the item, but is not responsible for loss or damage beyond what is recoverable through its own insurance, if any.

6. Either party may withdraw the item from consignment with written notice, provided it is not already under a pending sale.

7. This agreement is electronically signed by Consignor below and is intended to be a legally binding agreement between the parties.`;
}
