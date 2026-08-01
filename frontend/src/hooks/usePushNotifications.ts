"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function usePushNotifications() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user || subscribedRef.current) return;

    async function subscribeToPush() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          // Re-subscribe to keep server in sync (user may have logged in on new device)
          await sendSubscriptionToServer(existingSub);
          subscribedRef.current = true;
          return;
        }

        // Get VAPID public key from server
        const vapidRes = await fetch(`${API_URL}/push/vapid-public-key`);
        if (!vapidRes.ok) return;
        const { publicKey } = await vapidRes.json();
        if (!publicKey) return;

        // Subscribe to push
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await sendSubscriptionToServer(subscription);
        subscribedRef.current = true;
        console.log("[PUSH] Subscribed to web push");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[PUSH] Subscription failed:", msg);
      }
    }

    async function sendSubscriptionToServer(subscription: PushSubscription) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        await fetch(`${API_URL}/push/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription: {
              endpoint: subscription.endpoint,
              keys: subscription.toJSON().keys,
            },
          }),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[PUSH] Failed to send subscription to server:", msg);
      }
    }

    // Request notification permission first
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          subscribeToPush();
        }
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      subscribeToPush();
    }
  }, [user]);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
