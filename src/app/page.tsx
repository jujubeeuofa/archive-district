import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ItemStatus } from "@/lib/enums";
import ItemCard from "@/components/ItemCard";

export default async function HomePage() {
  const featured = await prisma.item.findMany({
    where: { status: ItemStatus.IN_STOCK },
    include: { photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-900 via-ink-950 to-black p-10 text-center sm:p-16">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Designer Resale</p>
        <h1 className="mt-3 text-4xl font-semibold text-bone sm:text-5xl">
          Authenticated Chrome Hearts &amp; streetwear, bought and sold.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-300">
          A father-son shop specializing in Chrome Hearts, Rick Owens, Supreme, and other
          high-end designer streetwear and accessories.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            Shop inventory
          </Link>
          <Link href="/sell" className="btn-secondary">
            Sell to us
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-bone">Newest arrivals</h2>
            <Link href="/shop" className="text-sm text-accent hover:text-accent-light">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
