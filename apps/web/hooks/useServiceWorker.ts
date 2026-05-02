import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    // Register service worker only in production or if available
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("Service Worker registered:", reg);
        })
        .catch((err) => {
          console.log("Service Worker registration failed:", err);
        });
    }
  }, []);
}
