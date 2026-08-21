import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import MessageThread from "@/components/MessageThread";

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const submission = await prisma.sellSubmission.findUnique({
    where: { id: params.id },
    include: {
      photos: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!submission || (submission.clientId !== user.id && user.role !== "ADMIN")) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/account" className="text-sm text-accent hover:text-accent-light">
            ← Back to account
          </Link>
          <h1 className="mt-1 text-2xl font-display uppercase text-bone">{submission.title}</h1>
          <p className="text-sm text-ink-400">
            {submission.brand} · {submission.category}
          </p>
        </div>
        <span className={`badge ${statusBadgeClass(submission.status)}`}>
          {submission.status.replace("_", " ")}
        </span>
      </div>

      {submission.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {submission.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.dataUrl}
              alt={submission.title}
              className="aspect-square w-full rounded-lg border border-ink-700 object-cover"
            />
          ))}
        </div>
      )}

      <div className="card p-5">
        <p className="text-sm text-ink-300 whitespace-pre-line">{submission.description}</p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="label">Asking price</p>
            <p className="text-bone">{formatMoney(submission.askingPrice)}</p>
          </div>
          <div>
            <p className="label">Our offer</p>
            <p className="text-bone">
              {submission.offerAmount != null ? formatMoney(submission.offerAmount) : "Not yet made"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-500">Submitted {formatDate(submission.createdAt)}</p>
      </div>

      <MessageThread
        messages={submission.messages}
        currentUserId={user.id}
        sellSubmissionId={submission.id}
        redirectPath={`/account/submissions/${submission.id}`}
      />
    </div>
  );
}
