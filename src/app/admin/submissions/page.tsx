import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireStaff();

  const { status } = searchParams;
  const where = status ? { status } : {};

  const submissions = await prisma.sellSubmission.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["SUBMITTED", "IN_REVIEW", "OFFER_MADE", "ACCEPTED", "DECLINED"];

  return (
    <div>
      <AdminNav active="/admin/submissions" />
      <h1 className="text-2xl font-display uppercase text-bone">Sell submissions</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/submissions"
          className={`badge ${!status ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/submissions?status=${s}`}
            className={`badge ${status === s ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Asking</th>
              <th className="px-4 py-2">Offer</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Authenticity</th>
              <th className="px-4 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-t border-ink-800 hover:bg-ink-900/50">
                <td className="px-4 py-2">
                  <Link href={`/admin/submissions/${s.id}`} className="text-accent hover:text-accent-light">
                    {s.brand} — {s.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-300">{s.client.name}</td>
                <td className="px-4 py-2">{formatMoney(s.askingPrice)}</td>
                <td className="px-4 py-2">{formatMoney(s.offerAmount)}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${statusBadgeClass(s.status)}`}>{s.status.replace("_", " ")}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`badge ${statusBadgeClass(s.authenticityStatus)}`}>{s.authenticityStatus}</span>
                </td>
                <td className="px-4 py-2 text-ink-400">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-500">
                  No submissions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
