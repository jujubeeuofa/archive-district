"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatMoney } from "@/lib/format";

type BuyButtonProps = {
  itemId: string;
  listPrice: number;
  /** The signed-in buyer's available trade-in credit, or null if signed out. */
  creditBalance: number | null;
};

export default function BuyButton({ itemId, listPrice, creditBalance }: BuyButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxApplicable = Math.max(0, Math.min(creditBalance ?? 0, listPrice));
  const [applyCredit, setApplyCredit] = useState(false);
  const [creditToApply, setCreditToApply] = useState(maxApplicable);

  const total = useMemo(() => {
    const applied = applyCredit ? Math.max(0, Math.min(creditToApply, maxApplicable)) : 0;
    return Math.round((listPrice - applied) * 100) / 100;
  }, [applyCredit, creditToApply, maxApplicable, listPrice]);

  async function handleBuy() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/shop/${itemId}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          creditToApply: applyCredit ? Math.max(0, Math.min(creditToApply, maxApplicable)) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting checkout.");
      setLoading(false);
    }
  }

  return (
    <div>
      {maxApplicable > 0 && (
        <div className="mb-3 rounded-lg border border-ink-700 bg-ink-900 p-3 text-sm text-bone">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyCredit}
              onChange={(e) => setApplyCredit(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-800 text-accent"
            />
            <span>Apply your trade-in credit ({formatMoney(creditBalance ?? 0)} available)</span>
          </label>
          {applyCredit && (
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="number"
                min={0}
                max={maxApplicable}
                step="0.01"
                value={creditToApply}
                onChange={(e) => setCreditToApply(Number(e.target.value) || 0)}
                className="input w-28 text-xs"
              />
              <span className="text-xs text-ink-400">of {formatMoney(maxApplicable)} max</span>
            </div>
          )}
        </div>
      )}

      {applyCredit && maxApplicable > 0 && (
        <p className="mb-2 text-sm text-ink-300">
          Total after credit: <span className="text-bone">{formatMoney(total)}</span>
        </p>
      )}

      <button onClick={handleBuy} disabled={loading} className="btn-primary w-full">
        {loading ? "Starting checkout..." : total <= 0 ? "Redeem with credit" : "Buy now"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
