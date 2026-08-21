import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import BuyButton from "@/components/BuyButton";
import { ItemStatus } from "@/lib/enums";
import { getSession } from "@/lib/session";
import { getCreditBalance } from "@/lib/credit";

export default async function ShopItemPage({ params }: { params: { id: string } }) {
  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: { photos: true },
  });

  if (!item) notFound();

  const session = await getSession();
  const creditBalance = session?.user ? await getCreditBalance(session.user.id) : null;

  const available = item.status === ItemStatus.IN_STOCK && item.authenticityStatus !== "FLAGGED";

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          {item.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photos[0].dataUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-600">No photo</div>
          )}
        </div>
        {item.photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {item.photos.slice(1).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.dataUrl}
                alt={item.title}
                className="aspect-square w-full rounded-lg border border-ink-700 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-accent">{item.brand}</p>
        <h1 className="mt-1 text-2xl font-display uppercase text-bone">{item.title}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {item.category} · Condition: {item.condition}
        </p>

        <p className="mt-4 font-display text-3xl text-accent">{formatMoney(item.listPrice)}</p>

        <p className="mt-4 whitespace-pre-line text-sm text-ink-300">{item.description}</p>

        <div className="mt-6">
          {available ? (
            <BuyButton itemId={item.id} listPrice={item.listPrice} creditBalance={creditBalance} />
          ) : (
            <div className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-center text-sm text-ink-400">
              {item.authenticityStatus === "FLAGGED"
                ? "This item is not available for sale."
                : `This item is no longer available (${item.status.replace("_", " ").toLowerCase()}).`}
            </div>
          )}
        </div>

        {item.authenticityStatus === "AUTHENTICATED" && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-400">
            ✓ Authenticated by our team
          </p>
        )}
      </div>
    </div>
  );
}
