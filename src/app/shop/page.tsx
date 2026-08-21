import { prisma } from "@/lib/prisma";
import { ItemStatus } from "@/lib/enums";
import ItemCard from "@/components/ItemCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams: { brand?: string; category?: string };
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const brand = searchParams.brand || "";
  const category = searchParams.category || "";

  // Flagged items never show in the storefront, regardless of stock status —
  // a safety net on top of the intake/edit workflow that's meant to keep
  // them off Held/In stock in the first place.
  const where: Record<string, unknown> = { status: ItemStatus.IN_STOCK, authenticityStatus: { not: "FLAGGED" } };
  if (brand) where.brand = brand;
  if (category) where.category = category;

  const [items, brands, categories] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { photos: { take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.findMany({
      where: { status: ItemStatus.IN_STOCK },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    prisma.item.findMany({
      where: { status: ItemStatus.IN_STOCK },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  function filterHref(next: { brand?: string; category?: string }) {
    const params = new URLSearchParams();
    const b = next.brand !== undefined ? next.brand : brand;
    const c = next.category !== undefined ? next.category : category;
    if (b) params.set("brand", b);
    if (c) params.set("category", c);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display uppercase text-bone">Shop</h1>
          <p className="mt-1 text-sm text-ink-300">{items.length} items in stock</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ brand: "" })}
            className={`badge ${!brand ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            All brands
          </Link>
          {brands.map((b) => (
            <Link
              key={b.brand}
              href={filterHref({ brand: b.brand })}
              className={`badge ${brand === b.brand ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
            >
              {b.brand}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={filterHref({ category: "" })}
          className={`badge ${!category ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={filterHref({ category: c.category })}
            className={`badge ${category === c.category ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {c.category}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-ink-400">No items match those filters.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
