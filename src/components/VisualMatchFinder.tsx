"use client";

import { useState, useTransition } from "react";
import type { VisualMatchResponse } from "@/app/admin/inventory/actions";

const SOURCE_LABEL: Record<string, string> = {
  stockx: "StockX",
  grailed: "Grailed",
};

/**
 * Google Lens-style companion to the plain-text StockX/Grailed search links
 * (see priceComp.ts): sends the item's first photo to Google Vision's Web
 * Detection API and lists back pages with a visually matching image,
 * StockX/Grailed hits sorted first. Calls the server action directly (not
 * via a <form action>) since it needs the result back to render, not just
 * to trigger a mutation.
 */
export default function VisualMatchFinder({
  itemId,
  action,
}: {
  itemId: string;
  action: (itemId: string) => Promise<VisualMatchResponse>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<VisualMatchResponse | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await action(itemId);
      setResult(res);
    });
  }

  return (
    <div className="card p-5">
      <p className="label mb-2">Visual match search</p>

      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="btn-secondary w-full disabled:opacity-60"
      >
        {pending ? "Searching…" : "Find visual matches"}
      </button>

      {result && !result.ok && <p className="mt-3 text-xs text-amber-400">{result.error}</p>}

      {result && result.ok && (
        <div className="mt-3 space-y-2">
          {result.bestGuess && (
            <p className="text-xs text-ink-400">
              Google&rsquo;s best guess: <span className="text-ink-300">{result.bestGuess}</span>
            </p>
          )}

          {result.matches.length === 0 ? (
            <p className="text-xs text-ink-500">No matching pages found for this photo.</p>
          ) : (
            <ul className="space-y-1.5">
              {result.matches.map((m) => (
                <li key={m.url}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      m.source === "other"
                        ? "text-xs text-ink-300 hover:underline"
                        : "text-xs text-accent hover:text-accent-light hover:underline"
                    }
                  >
                    {m.source !== "other" ? `[${SOURCE_LABEL[m.source]}] ` : ""}
                    {m.title || m.url} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">
        Reverse-image search against the item&rsquo;s first photo — finds pages with a visually
        similar image anywhere on the web, not limited to StockX/Grailed and not a guaranteed
        match. Treat it as a lead to check, not a confirmed comp.
      </p>
    </div>
  );
}
