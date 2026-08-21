"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import type { ChecklistItemTemplate, ReferenceGuide } from "@/lib/authenticity";

type ExistingCheck = {
  checklist: { id: string; label: string; checked: boolean; note?: string }[];
  decision: string;
  notes: string | null;
  reviewedByName?: string | null;
  reviewedAt?: Date | string | null;
};

type AuthenticityChecklistProps = {
  brand: string;
  template: ChecklistItemTemplate[];
  existing: ExistingCheck | null;
  action: (formData: FormData) => void;
  referenceGuides?: ReferenceGuide[];
};

const DECISION_COPY: Record<string, { label: string; className: string }> = {
  UNVERIFIED: { label: "Unverified", className: "bg-amber-900/40 text-amber-300 border-amber-700" },
  AUTHENTICATED: { label: "Authenticated", className: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  FLAGGED: { label: "Flagged", className: "bg-red-900/40 text-red-300 border-red-700" },
};

/**
 * Renders a brand-aware authenticity checklist and saves it via a bound
 * server action. Reused on both the admin item-detail page and the
 * sell-submission review page — the caller passes the brand's template,
 * any existing saved check, and a server action already bound to the
 * item/submission id (see saveItemAuthenticityCheck / saveSubmissionAuthenticityCheck).
 */
export default function AuthenticityChecklist({
  brand,
  template,
  existing,
  action,
  referenceGuides = [],
}: AuthenticityChecklistProps) {
  const initialChecked = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const t of template) {
      const found = existing?.checklist.find((c) => c.id === t.id);
      map[t.id] = found?.checked ?? false;
    }
    return map;
  }, [template, existing]);

  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const current = existing ? DECISION_COPY[existing.decision] ?? DECISION_COPY.UNVERIFIED : null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="label">Authenticity check{brand ? ` — ${brand}` : ""}</p>
        {current && <span className={`badge ${current.className}`}>{current.label}</span>}
      </div>

      {existing?.reviewedByName && (
        <p className="mt-1 text-xs text-ink-500">
          Last reviewed by {existing.reviewedByName}
          {existing.reviewedAt ? ` on ${formatDate(existing.reviewedAt)}` : ""}
        </p>
      )}

      <p className="mt-2 text-xs text-ink-500">
        A starting checklist based on common legit-check points — not a certified authentication.
        Refine with your own judgment, and route anything genuinely uncertain to a professional
        authenticator before listing.
      </p>

      {referenceGuides.length > 0 && (
        <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900 p-3">
          <p className="label mb-2">Reference guides</p>
          <ul className="space-y-1.5">
            {referenceGuides.map((g) => (
              <li key={g.url}>
                <a
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:text-accent-light hover:underline"
                >
                  {g.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-500">
            External real-vs-fake guides — for reference while reviewing, not official brand
            documentation.
          </p>
        </div>
      )}

      <form action={action} className="mt-4 space-y-3">
        <div className="space-y-2">
          {template.map((t) => {
            const existingNote = existing?.checklist.find((c) => c.id === t.id)?.note ?? "";
            return (
              <div key={t.id} className="rounded-lg border border-ink-700 bg-ink-900 p-3">
                <label className="flex items-start gap-2 text-sm text-bone">
                  <input
                    type="checkbox"
                    name={`check__${t.id}`}
                    defaultChecked={initialChecked[t.id]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [t.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-800 text-accent"
                  />
                  <span>{t.label}</span>
                </label>
                <input
                  type="text"
                  name={`note__${t.id}`}
                  defaultValue={existingNote}
                  placeholder="Note (optional) — e.g. what you saw, good or bad"
                  className="input mt-2 text-xs"
                />
              </div>
            );
          })}
        </div>

        <p className="text-xs text-ink-400">
          {checkedCount} of {template.length} checked
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="decision">Decision</label>
            <select
              className="input"
              id="decision"
              name="decision"
              defaultValue={existing?.decision ?? "UNVERIFIED"}
            >
              <option value="UNVERIFIED">Unverified — review not finished</option>
              <option value="AUTHENTICATED">Authenticated — passes review</option>
              <option value="FLAGGED">Flagged — do not sell</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Overall notes</label>
          <textarea
            className="input min-h-16 text-sm"
            id="notes"
            name="notes"
            defaultValue={existing?.notes ?? ""}
            placeholder="Anything else relevant to the decision"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Save authenticity check
        </button>
      </form>
    </div>
  );
}
