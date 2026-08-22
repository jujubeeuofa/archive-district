import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import { canFinalizeConsignment } from "@/lib/permissions";
import {
  updateConsignmentTerms,
  markConsignmentSent,
  voidConsignment,
  markConsignmentPaid,
} from "../actions";

export default async function ConsignmentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireStaff();
  const canFinalize = canFinalizeConsignment(user.role);

  const agreement = await prisma.consignmentAgreement.findUnique({
    where: { id: params.id },
    include: { item: true },
  });
  if (!agreement) notFound();

  const editable = agreement.status === "DRAFT";
  const boundUpdate = updateConsignmentTerms.bind(null, agreement.id);
  const boundSend = markConsignmentSent.bind(null, agreement.id);
  const boundVoid = voidConsignment.bind(null, agreement.id);
  const boundMarkPaid = markConsignmentPaid.bind(null, agreement.id);

  const signUrl = `/consign/sign/${agreement.signToken}`;

  return (
    <div>
      <AdminNav active="/admin/consignments" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/admin/inventory/${agreement.itemId}`} className="text-sm text-accent hover:text-accent-light">
            ← {agreement.item.title}
          </Link>
          <h1 className="mt-1 text-2xl font-display uppercase text-bone">Consignment agreement</h1>
        </div>
        <span className={`badge ${statusBadgeClass(agreement.status)}`}>{agreement.status}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form action={boundUpdate} className="card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="consignorName">Consignor name</label>
                <input
                  className="input"
                  id="consignorName"
                  name="consignorName"
                  defaultValue={agreement.consignorName}
                  disabled={!editable}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="consignorSplitPct">Consignor split (%)</label>
                <input
                  className="input"
                  id="consignorSplitPct"
                  name="consignorSplitPct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={agreement.consignorSplitPct}
                  disabled={!editable}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="consignorEmail">Consignor email</label>
                <input
                  className="input"
                  id="consignorEmail"
                  name="consignorEmail"
                  type="email"
                  defaultValue={agreement.consignorEmail ?? ""}
                  disabled={!editable}
                />
              </div>
              <div>
                <label className="label" htmlFor="consignorPhone">Consignor phone</label>
                <input
                  className="input"
                  id="consignorPhone"
                  name="consignorPhone"
                  type="tel"
                  defaultValue={agreement.consignorPhone ?? ""}
                  disabled={!editable}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="listPrice">List price ($)</label>
                <input
                  className="input"
                  id="listPrice"
                  name="listPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={agreement.listPrice}
                  disabled={!editable}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="floorPrice">Floor price ($, optional)</label>
                <input
                  className="input"
                  id="floorPrice"
                  name="floorPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={agreement.floorPrice ?? ""}
                  disabled={!editable}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="contractTerms">Contract terms</label>
              <textarea
                className="input min-h-64 font-mono text-xs"
                id="contractTerms"
                name="contractTerms"
                defaultValue={agreement.contractTerms}
                disabled={!editable}
                required
              />
            </div>

            {editable && (
              <button type="submit" className="btn-secondary w-full">
                Save changes
              </button>
            )}
            {!editable && (
              <p className="text-xs text-ink-500">
                Terms lock once the agreement has been sent — this is what the consignor will see
                (or already saw and signed).
              </p>
            )}
          </form>

          {agreement.status === "SIGNED" && agreement.contractSnapshot && (
            <div className="card p-6">
              <p className="label mb-2">Signed contract snapshot</p>
              <pre className="whitespace-pre-wrap font-mono text-xs text-ink-300">
                {agreement.contractSnapshot}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {agreement.status === "DRAFT" && (
            <div className="card p-5">
              <p className="label mb-2">Send for signature</p>
              <p className="text-xs text-ink-500">
                Share this link with the consignor however you normally reach them (text, email) —
                no account needed on their end.
              </p>
              <p className="mt-2 break-all rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-accent">
                {signUrl}
              </p>
              {canFinalize ? (
                <form action={boundSend} className="mt-3">
                  <button type="submit" className="btn-primary w-full">
                    Mark as sent
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-ink-500">
                  Sending this agreement commits the shop to these terms — an Admin needs to mark it sent.
                </p>
              )}
            </div>
          )}

          {agreement.status === "SENT" && (
            <div className="card p-5">
              <p className="label mb-2">Awaiting signature</p>
              <p className="mt-2 break-all rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-accent">
                {signUrl}
              </p>
            </div>
          )}

          {agreement.status === "SIGNED" && (
            <div className="card p-5">
              <p className="label mb-2">Signed</p>
              <p className="text-sm text-bone">{agreement.signerName}</p>
              <p className="text-xs text-ink-500">
                {agreement.signedAt ? formatDate(agreement.signedAt) : ""}
                {agreement.signerIp ? ` · ${agreement.signerIp}` : ""}
              </p>
            </div>
          )}

          <div className="card p-5">
            <p className="label mb-2">Payout</p>
            {agreement.payoutStatus === "NOT_YET_SOLD" && (
              <p className="text-sm text-ink-500">Item hasn&apos;t sold yet.</p>
            )}
            {agreement.payoutStatus === "OWED" && (
              <>
                <p className="text-lg font-semibold text-amber-300">
                  Owed {formatMoney(agreement.payoutAmount)}
                </p>
                {canFinalize ? (
                  <form action={boundMarkPaid} className="mt-3 space-y-2">
                    <input className="input" type="text" name="paidNote" placeholder="Paid via… (optional note)" />
                    <button type="submit" className="btn-primary w-full">
                      Mark paid
                    </button>
                  </form>
                ) : (
                  <p className="mt-3 text-xs text-ink-500">Only an Admin can mark a consignor payout paid.</p>
                )}
              </>
            )}
            {agreement.payoutStatus === "PAID" && (
              <>
                <p className="text-lg font-semibold text-emerald-400">
                  Paid {formatMoney(agreement.payoutAmount)}
                </p>
                <p className="text-xs text-ink-500">
                  {agreement.paidAt ? formatDate(agreement.paidAt) : ""}
                  {agreement.paidNote ? ` · ${agreement.paidNote}` : ""}
                </p>
              </>
            )}
          </div>

          {canFinalize && agreement.status !== "VOIDED" && agreement.status !== "SIGNED" && (
            <form action={boundVoid}>
              <button type="submit" className="btn-danger w-full">
                Void agreement
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
