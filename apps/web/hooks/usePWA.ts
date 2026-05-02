import { useEffect, useState } from "react";

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial offline status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return { success: false, error: "App not installable" };

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        return { success: true };
      } else {
        return { success: false, error: "User dismissed install prompt" };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Installation failed";
      return { success: false, error: message };
    }
  };

  const shareApp = async (title: string, text: string, url: string) => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      return { success: true, fallback: true };
    }

    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Share failed";
      return { success: false, error: message };
    }
  };

  const requestPermission = async (permission: PermissionName) => {
    try {
      const result = await navigator.permissions.query({ name: permission });
      return result.state;
    } catch (err) {
      return "denied";
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    installApp,
    shareApp,
    requestPermission,
  };
}

type PermissionName =
  | "geolocation"
  | "notifications"
  | "camera"
  | "microphone"
  | "clipboard-read"
  | "clipboard-write";
