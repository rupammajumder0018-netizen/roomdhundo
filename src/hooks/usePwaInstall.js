import { useState, useEffect, useCallback } from "react";

const DISMISSED_KEY = "pgdhundo_pwa_dismissed_until";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if already running as installed PWA (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Check if user recently dismissed the prompt
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    const isDismissed = dismissedUntil && Date.now() < Number(dismissedUntil);

    // 4. Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. For iOS: show prompt after 30s delay if not dismissed & not standalone
    let timerId = null;
    if (isIosDevice && !isDismissed) {
      timerId = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    } catch (err) {
      console.warn("[PWA] Error launching install prompt:", err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
    setShowPrompt(false);
  }, []);

  return {
    canInstallAndroid: !!deferredPrompt,
    isIOS,
    isInstalled,
    showPrompt,
    promptInstall,
    dismissPrompt,
    setShowPrompt,
  };
}

export default usePwaInstall;
