import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateItem, deleteItemPhoto, deleteItem, saveItemAuthenticityCheck } from "../actions";
import { createConsignmentAgreement } from "../../consignments/actions";
import PhotoUpload from "@/components/PhotoUpload";
import AdminNav from "@/components/AdminNav";
import AuthenticityChecklist from "@/components/AuthenticityChecklist";
import { computeMargin, formatMoney, statusBadgeClass } from "@/lib/format";
import { stockXSearchUrl, grailedSearchUrl } from "@/lib/priceComp";
import { getChecklistTemplate, getReferenceGuides } from "@/lib/authenticity";
import { buildDefaultConsignmentContract } from "@/lib/consignment";
import type { ChecklistEntry } from "@/lib/enums";

export default async function AdminItemDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: { photos: true, authenticityCheck: { include: { reviewedBy: true } }, consignmentAgreement: true },
  });
  if (!item) notFound();

  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  const boundCreateConsignment = createConsignmentAgreement.bind(null, item.id);
  const defaultConsignmentContract = buildDefaultConsignmentContract({
    consignorName: "",
    itemTitle: item.title,
    listPrice: item.listPrice,
    floorPrice: null,
    consignorSplitPct: 60,
  });

  const { margin, marginPct } = computeMargin(item.costPrice, item.listPrice, item.soldPrice);
  const boundUpdate = updateItem.bind(null, item.id);
  const boundDelete = deleteItem.bind(null, item.id);
  const boundAuthCheck = saveItemAuthenticityCheck.bind(null, item.id);
  const stockxUrl = stockXSearchUrl(item.brand, item.title);
  const grailedUrl = grailedSearchUrl(item.brand, item.title);
  const checklistTemplate = getChecklistTemplate(item.brand);
  const referenceGuides = getReferenceGuides(item.brand);
  const existingCheck = item.authenticityCheck
    ? {
        checklist: JSON.parse(item.authenticityCheck.checklist) as ChecklistEntry[],
        decision: item.authenticityCheck.decision,
        notes: item.authenticityCheck.notes,
        reviewedByName: item.authenticityCheck.reviewedBy?.name,
        reviewedAt: item.authenticityCheck.updatedAt,
      }
    : null;

  return (
    <div>
      <AdminNav active="/admin/inventory" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display uppercase text-bone">{item.title}</h1>
          <p className="text-sm text-ink-400">{item.brand} · {item.category}</p>
        </div>
        <form action={boundDelete}>
          <button type="submit" className="btn-danger">
            Delete item
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form action={boundUpdate} className="card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input className="input" id="title" name="title" defaultValue={item.title} required />
              </div>
              <div>
                <label className="label" htmlFor="brand">Brand</label>
                <input className="input" id="brand" name="brand" defaultValue={item.brand} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category">Category</label>
                <input className="input" id="category" name="category" defaultValue={item.category} required />
              </div>
              <div>
                <label className="label" htmlFor="condition">Condition</label>
                <input className="input" id="condition" name="condition" defaultValue={item.condition} required />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea
                className="input min-h-24"
                id="description"
                name="description"
                defaultValue={item.description}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="costPrice">Cost price ($)</label>
                <input
                  className="input"
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  defaultValue={item.costPrice}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="listPrice">List price ($)</label>
                <input
                  className="input"
                  id="listPrice"
                  name="listPrice"
                  type="number"
                  step="0.01"
                  defaultValue={item.listPrice}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="soldPrice">Sold price ($)</label>
                <input
                  className="input"
                  id="soldPrice"
                  name="soldPrice"
                  type="number"
                  step="0.01"
                  defaultValue={item.soldPrice ?? ""}
                  placeholder="—"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select className="input" id="status" name="status" defaultValue={item.status}>
                  <option value="IN_STOCK">In stock</option>
                  <option value="HELD">Held</option>
                  <option value="PENDING_INTAKE">Pending intake</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>
              <div>
                <span className="label block">Authenticity</span>
                <div className="input flex items-center justify-between bg-ink-900/60">
                  <span className={`badge ${statusBadgeClass(item.authenticityStatus)}`}>
                    {item.authenticityStatus}
                  </span>
                  <span className="text-xs text-ink-500">set via checklist →</span>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="source">Source</label>
                <select className="input" id="source" name="source" defaultValue={item.source}>
                  <option value="PURCHASED">Purchased</option>
                  <option value="CONSIGNED">Consigned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="vendorId">Vendor</label>
              <select className="input" id="vendorId" name="vendorId" defaultValue={item.vendorId ?? ""}>
                <option value="">No vendor on record</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Add photos</label>
              <PhotoUpload name="newPhotos" maxPhotos={8} />
            </div>

            <button type="submit" className="btn-primary w-full">
              Save changes
            </button>
          </form>

          {item.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {item.photos.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt="" className="h-full w-full object-cover" />
                  <form action={deleteItemPhoto.bind(null, item.id, p.id)}>
                    <button
                      type="submit"
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-xs text-bone opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Computed margin</p>
            <p className={`mt-1 text-2xl font-semibold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatMoney(margin)}
            </p>
            <p className="text-xs text-ink-400">{marginPct.toFixed(1)}% over cost</p>
            <p className="mt-3 text-xs text-ink-500">
              Based on {item.soldPrice != null ? "sold price" : "list price"} minus cost. Not stored — computed on the fly.
            </p>
          </div>

          <div className="card p-5">
            <p className="label mb-2">Price comparison</p>
            <div className="space-y-2">
              <a
                href={stockxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary block text-center"
              >
                Check StockX ↗
              </a>
              <a
                href={grailedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary block text-center"
              >
                Check Grailed ↗
              </a>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Opens a search on each marketplace — not an automated price feed.
            </p>
          </div>

          <AuthenticityChecklist
            brand={item.brand}
            template={checklistTemplate}
            existing={existingCheck}
            action={boundAuthCheck}
            referenceGuides={referenceGuides}
          />

          <div className="card p-5">
            <p className="label mb-2">Consignment</p>
            {item.consignmentAgreement ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${statusBadgeClass(item.consignmentAgreement.status)}`}>
                    {item.consignmentAgreement.status}
                  </span>
                  <span className="text-xs text-ink-400">
                    {item.consignmentAgreement.consignorSplitPct}% to {item.consignmentAgreement.consignorName}
                  </span>
                </div>
                {item.consignmentAgreement.payoutStatus === "OWED" && (
                  <p className="mt-2 text-sm text-amber-300">
                    Owed {formatMoney(item.consignmentAgreement.payoutAmount)}
                  </p>
                )}
                {item.consignmentAgreement.payoutStatus === "PAID" && (
                  <p className="mt-2 text-sm text-emerald-400">
                    Paid {formatMoney(item.consignmentAgreement.payoutAmount)}
                  </p>
                )}
                <Link
                  href={`/admin/consignments/${item.consignmentAgreement.id}`}
                  className="btn-secondary mt-3 block text-center"
                >
                  View agreement
                </Link>
              </div>
            ) : (
              <details>
                <summary className="cursor-pointer text-sm text-accent hover:text-accent-light">
                  Set up a consignment agreement
                </summary>
                <form action={boundCreateConsignment} className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="consignorName">Consignor name</label>
                      <input className="input" id="consignorName" name="consignorName" required />
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
                        defaultValue={60}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="consignorEmail">Email</label>
                      <input className="input" id="consignorEmail" name="consignorEmail" type="email" />
                    </div>
                    <div>
                      <label className="label" htmlFor="consignorPhone">Phone</label>
                      <input className="input" id="consignorPhone" name="consignorPhone" type="tel" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="listPrice">List price ($)</label>
                      <input
                        className="input"
                        id="listPrice"
                        name="listPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.listPrice}
                        required
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="floorPrice">Floor price ($, optional)</label>
                      <input className="input" id="floorPrice" name="floorPrice" type="number" min="0" step="0.01" />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="contractTerms">Contract terms</label>
                    <textarea
                      className="input min-h-48 font-mono text-xs"
                      id="contractTerms"
                      name="contractTerms"
                      defaultValue={defaultConsignmentContract}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Create agreement
                  </button>
                </form>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
