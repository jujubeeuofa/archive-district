"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "subscribing" | "subscribed" | "unsupported" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setStatus("subscribed");
      });
    });
  }, []);

  async function handleSubscribe() {
    setMessage(null);

    if (!vapidPublicKey) {
      setStatus("error");
      setMessage(
        "Push isn't configured on this server yet (missing VAPID keys). See README for setup instructions."
      );
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      setMessage("Push notifications aren't supported in this browser.");
      return;
    }

    setStatus("subscribing");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMessage("Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save subscription.");
      }

      setStatus("subscribed");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to subscribe to push notifications.");
    }
  }

  if (status === "subscribed") {
    return <p className="text-sm text-emerald-400">✓ Push notifications enabled on this device.</p>;
  }

  return (
    <div>
      <button
        onClick={handleSubscribe}
        disabled={status === "subscribing"}
        className="btn-secondary"
      >
        {status === "subscribing" ? "Enabling..." : "Enable push notifications"}
      </button>
      {message && <p className="mt-2 text-xs text-ink-400">{message}</p>}
    </div>
  );
}
