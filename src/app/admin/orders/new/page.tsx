import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createWalkInSale } from "../actions";
import AdminNav from "@/components/AdminNav";
import { ItemStatus, Role } from "@/lib/enums";

/**
 * Logs an in-person sale in one step — a physical card terminal, the US
 * Bank iPhone app, or plain cash rung up in the shop, for an item that
 * never went through the web checkout. See createWalkInSale for the
 * scaffolding note on the US Bank integration itself.
 */
export default async function NewWalkInSalePage() {
  await requireAdmin();

  const [items, clients] = await Promise.all([
    prisma.item.findMany({
      where: { status: ItemStatus.IN_STOCK },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <AdminNav active="/admin/orders" />
      <h1 className="text-2xl font-display uppercase text-bone">Log a walk-in sale</h1>
      <p className="mt-1 text-sm text-ink-400">
        For an in-person sale that didn't go through the web checkout — a card terminal, the US
        Bank app, or cash rung up in the shop. Marks the item sold immediately.
      </p>

      <form action={createWalkInSale} className="card mt-6 max-w-xl space-y-4 p-6">
        <div>
          <label className="label" htmlFor="itemId">Item</label>
          <select className="input" id="itemId" name="itemId" required>
            <option value="">Select an in-stock item…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} — {i.brand} ({i.listPrice})
              </option>
            ))}
          </select>
          {items.length === 0 && (
            <p className="mt-1 text-xs text-ink-500">No in-stock items available to sell.</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="buyerId">Buyer</label>
          <select className="input" id="buyerId" name="buyerId" required>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-500">
            Walk-in buyer needs an existing client account for now — have them register, or use
            an existing account, before logging the sale.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="salePrice">Sale price ($)</label>
          <input
            className="input"
            id="salePrice"
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Defaults to list price if left blank"
          />
        </div>

        <div>
          <label className="label" htmlFor="tenderType">Tender</label>
          <select className="input" id="tenderType" name="tenderType" defaultValue="US_BANK">
            <option value="US_BANK">US Bank (terminal/app/gateway)</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <button type="submit" className="btn-primary w-full">
          Log sale
        </button>
      </form>
    </div>
  );
}
