"use client";

import { useRef, useTransition } from "react";

export default function NotifyNewItemsToggle({
  defaultChecked,
  action,
}: {
  defaultChecked: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={action}
      onChange={(e) => {
        const form = e.currentTarget;
        startTransition(() => {
          action(new FormData(form));
        });
      }}
    >
      <label className="flex items-center gap-2 text-sm text-bone">
        <input
          type="checkbox"
          name="notifyNewItems"
          defaultChecked={defaultChecked}
          className="h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-800 text-accent"
        />
        <span>Notify me by push when new items are added to inventory</span>
      </label>
      {isPending && <p className="mt-1 text-xs text-ink-500">Saving…</p>}
    </form>
  );
}
