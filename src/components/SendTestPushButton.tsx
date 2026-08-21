"use client";

import { useState } from "react";

export default function SendTestPushButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "Archive District",
          body: "This is a test push notification from the admin dashboard.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to send push.");
        return;
      }
      setStatus("sent");
      setMessage(`Sent to ${data.sent} device(s)${data.failed ? `, ${data.failed} failed` : ""}.`);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Failed to send push.");
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={status === "sending"} className="btn-secondary text-xs">
        {status === "sending" ? "Sending..." : "Send test push"}
      </button>
      {message && (
        <p className={`mt-1 text-xs ${status === "error" ? "text-red-300" : "text-ink-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
