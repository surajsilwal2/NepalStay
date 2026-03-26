"use client";
import { useEffect } from "react";

/**
 * Registers the Service Worker for PWA offline support.
 * Add this to app/layout.tsx inside the body.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("[SW] Registered:", reg.scope))
          .catch((err) => console.error("[SW] Registration failed:", err));
      });
    }
  }, []);

  return null; // renders nothing
}
