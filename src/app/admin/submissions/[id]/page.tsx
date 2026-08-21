import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  updateSubmissionStatus,
  makeOffer,
  convertToInventory,
  saveSubmissionAuthenticityCheck,
} from "../actions";
import AdminNav from "@/components/AdminNav";
import MessageThread from "@/components/MessageThread";
import AuthenticityChecklist from "@/components/AuthenticityChecklist";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import { getChecklistTemplate } from "@/lib/authenticity";
import type { ChecklistEntry } from "@/lib/enums";

export default async function AdminSubmissionDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();

  const submission = await prisma.sellSubmission.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      photos: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      authenticityCheck: { include: { reviewedBy: true } },
    },
  });
  if (!submission) notFound();

  const boundStatus = updateSubmissionStatus.bind(null, submission.id);
  const boundOffer = makeOffer.bind(null, submission.id);
  const boundConvert = convertToInventory.bind(null, submission.id);
  const boundAuthCheck = saveSubmissionAuthenticityCheck.bind(null, submission.id);
  const checklistTemplate = getChecklistTemplate(submission.brand);
  const existingCheck = submission.authenticityCheck
    ? {
        checklist: JSON.parse(submission.authenticityCheck.checklist) as ChecklistEntry[],
        decision: submission.authenticityCheck.decision,
        notes: submission.authenticityCheck.notes,
        reviewedByName: submission.authenticityCheck.reviewedBy?.name,
        reviewedAt: submission.authenticityCheck.updatedAt,
      }
    : null;

  return (
    <div>
      <AdminNav active="/admin/submissions" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display uppercase text-bone">{submission.title}</h1>
          <p className="text-sm text-ink-400">
            {submission.brand} · {submission.category} · from {submission.client.name} (
            {submission.client.email})
          </p>
          <p className="text-xs text-ink-500">Submitted {formatDate(submission.createdAt)}</p>
        </div>
        <span className={`badge ${statusBadgeClass(submission.status)}`}>
          {submission.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {submission.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {submission.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.dataUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg border border-ink-700 object-cover"
                />
              ))}
            </div>
          )}

          <div className="card p-5">
            <p className="label">Description</p>
            <p className="mt-1 whitespace-pre-line text-sm text-bone">{submission.description}</p>
            <p className="mt-3 label">Asking price</p>
            <p className="text-sm text-bone">{formatMoney(submission.askingPrice)}</p>
          </div>

          <MessageThread
            messages={submission.messages}
            currentUserId={admin.id}
            sellSubmissionId={submission.id}
            redirectPath={`/admin/submissions/${submission.id}`}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label mb-2">Update status</p>
            <form action={boundStatus} className="flex gap-2">
              <select className="input" name="status" defaultValue={submission.status}>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_REVIEW">In review</option>
                <option value="OFFER_MADE">Offer made</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="DECLINED">Declined</option>
              </select>
              <button type="submit" className="btn-secondary shrink-0">
                Save
              </button>
            </form>
          </div>

          <div className="card p-5">
            <p className="label mb-2">Make / update offer</p>
            <form action={boundOffer} className="flex gap-2">
              <input
                className="input"
                type="number"
                name="offerAmount"
                min="0"
                step="1"
                defaultValue={submission.offerAmount ?? undefined}
                placeholder="Offer amount"
              />
              <button type="submit" className="btn-secondary shrink-0">
                Send
              </button>
            </form>
          </div>

          <div className="card p-5">
            <p className="label mb-2">Convert to inventory</p>
            <p className="text-xs text-ink-500">
              Creates a new inventory item (status: Pending intake, source: Consigned) copying this
              submission&apos;s details, photos, and authenticity check, and marks the submission Accepted.
            </p>
            {submission.authenticityStatus === "UNVERIFIED" && (
              <p className="mt-2 rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
                Authenticity check hasn&apos;t been run yet — recommend completing it below before
                accepting.
              </p>
            )}
            {submission.authenticityStatus === "FLAGGED" && (
              <p className="mt-2 rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-xs text-red-300">
                This submission is flagged as a likely authenticity concern. Converting it to
                inventory carries that flag over — reconsider before accepting.
              </p>
            )}
            <form action={boundConvert} className="mt-3">
              <button type="submit" className="btn-primary w-full">
                Accept &amp; convert to inventory
              </button>
            </form>
          </div>

          <AuthenticityChecklist
            brand={submission.brand}
            template={checklistTemplate}
            existing={existingCheck}
            action={boundAuthCheck}
          />
        </div>
      </div>
    </div>
  );
}
