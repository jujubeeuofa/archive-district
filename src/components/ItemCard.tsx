import Link from "next/link";
import { formatMoney } from "@/lib/format";

type ItemCardProps = {
  item: {
    id: string;
    title: string;
    brand: string;
    category: string;
    listPrice: number;
    authenticityStatus?: string;
    photos: { dataUrl: string }[];
  };
};

export default function ItemCard({ item }: ItemCardProps) {
  const photo = item.photos[0]?.dataUrl;

  return (
    <Link href={`/shop/${item.id}`} className="card group overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="relative aspect-square w-full overflow-hidden bg-ink-900">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={item.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            No photo
          </div>
        )}
        {item.authenticityStatus === "AUTHENTICATED" && (
          <span className="absolute left-2 top-2 rounded-full border border-emerald-700 bg-emerald-900/80 px-2 py-0.5 text-[10px] font-medium text-emerald-300 backdrop-blur">
            ✓ Authenticated
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs uppercase tracking-wide text-accent">{item.brand}</p>
        <h3 className="mt-0.5 truncate text-sm font-medium text-bone">{item.title}</h3>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-ink-400">{item.category}</span>
          <span className="text-sm font-semibold text-bone">{formatMoney(item.listPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
