import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { signConsignmentAgreement, declineConsignmentAgreement } from "../../actions";

/**
 * Public, no-login e-signature page for a consignment agreement. Reached
 * only via the long random signToken link an admin shares with the
 * consignor directly — not linked from anywhere in the app's nav.
 */
export default async function ConsignmentSignPage({ params }: { params: { token: string } }) {
  const agreement = await prisma.consignmentAgreement.findUnique({
    where: { signToken: params.token },
    include: { item: true },
  });
  if (!agreement) notFound();

  const boundSign = signConsignmentAgreement.bind(null, params.token);
  const boundDecline = declineConsignmentAgreement.bind(null, params.token);
  const canSign = agreement.status === "DRAFT" || agreement.status === "SENT";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Consignment Agreement</p>
        <h1 className="mt-1 text-2xl font-display uppercase text-bone">{agreement.item.title}</h1>
        <p className="text-sm text-ink-400">
          Prepared for {agreement.consignorName} · List price {formatMoney(agreement.listPrice)}
          {agreement.floorPrice != null ? ` · Floor ${formatMoney(agreement.floorPrice)}` : ""} ·{" "}
          {agreement.consignorSplitPct}% to consignor
        </p>
      </div>

      {agreement.status === "SIGNED" && (
        <div className="card p-5">
          <p className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-300">
            Signed by {agreement.signerName} on {agreement.signedAt ? formatDate(agreement.signedAt) : ""}.
            Thank you — Archive District has this on file.
          </p>
        </div>
      )}

      {agreement.status === "DECLINED" && (
        <div className="card p-5">
          <p className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            This agreement was declined. If that was a mistake, contact Archive District directly.
          </p>
        </div>
      )}

      {agreement.status === "VOIDED" && (
        <div className="card p-5">
          <p className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-400">
            This agreement is no longer active.
          </p>
        </div>
      )}

      <div className="card p-6">
        <p className="label mb-2">Terms</p>
        <pre className="whitespace-pre-wrap font-mono text-xs text-ink-300">{agreement.contractTerms}</pre>
      </div>

      {canSign && (
        <div className="card p-6">
          <form action={boundSign} className="space-y-4">
            <div>
              <label className="label" htmlFor="signerName">Type your full legal name to sign</label>
              <input className="input" id="signerName" name="signerName" required />
            </div>
            <label className="flex items-start gap-2 text-sm text-bone">
              <input
                type="checkbox"
                name="agree"
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-800 text-accent"
              />
              <span>
                I have read and agree to the terms above, and intend this typed name as my
                electronic signature on this agreement.
              </span>
            </label>
            <button type="submit" className="btn-primary w-full">
              Sign agreement
            </button>
          </form>
          <form action={boundDecline} className="mt-3">
            <button type="submit" className="btn-secondary w-full">
              Decline
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
