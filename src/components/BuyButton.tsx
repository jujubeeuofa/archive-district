"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BuyButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ itemId }),
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
      <button onClick={handleBuy} disabled={loading} className="btn-primary w-full">
        {loading ? "Starting checkout..." : "Buy now"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
