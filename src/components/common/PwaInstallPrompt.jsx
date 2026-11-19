import React from "react";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";

export function PwaInstallPrompt() {
  const {
    canInstallAndroid,
    isIOS,
    isInstalled,
    showPrompt,
    promptInstall,
    dismissPrompt,
  } = usePwaInstall();

  // If already installed or prompt not triggered, render nothing
  if (isInstalled || !showPrompt) {
    return null;
  }

  // ── iOS Step-by-Step Installation Modal ───────────────────
  if (isIOS) {
    return (
      <div
        className="pwa-ios-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Install Pg Dhundo on iOS"
      >
        <div className="pwa-ios-modal">
          <button
            type="button"
            className="pwa-close-btn"
            onClick={dismissPrompt}
            aria-label="Close installation guide"
          >
            ✕
          </button>

          <div className="pwa-ios-header">
            <img
              src="/icons/icon-96x96.png"
              alt="Pg Dhundo"
              className="pwa-app-icon"
              width="48"
              height="48"
            />
            <div className="pwa-ios-header-text">
              <h3>Install Pg Dhundo</h3>
              <p>Add to your Home Screen for the best experience</p>
            </div>
          </div>

          <div className="pwa-ios-steps">
            <div className="pwa-ios-step">
              <span className="pwa-ios-step-num">1</span>
              <div className="pwa-ios-step-content">
                Tap the <strong>Share</strong> button in Safari toolbar
              </div>
              <span className="pwa-ios-step-icon" aria-hidden="true">
                📤
              </span>
            </div>

            <div className="pwa-ios-step">
              <span className="pwa-ios-step-num">2</span>
              <div className="pwa-ios-step-content">
                Scroll down and tap <strong>Add to Home Screen</strong>
              </div>
              <span className="pwa-ios-step-icon" aria-hidden="true">
                ➕
              </span>
            </div>

            <div className="pwa-ios-step">
              <span className="pwa-ios-step-num">3</span>
              <div className="pwa-ios-step-content">
                Tap <strong>Add</strong> in the top-right corner
              </div>
              <span className="pwa-ios-step-icon" aria-hidden="true">
                ✨
              </span>
            </div>
          </div>

          <div className="pwa-ios-pointer">
            <span className="pwa-ios-pointer-arrow" aria-hidden="true">
              ⬇️
            </span>
            <span>Tap Safari&apos;s share icon at the bottom of the screen</span>
          </div>

          <button
            type="button"
            className="pwa-ios-gotit-btn"
            onClick={dismissPrompt}
          >
            Got It!
          </button>
        </div>
      </div>
    );
  }

  // ── Android / Desktop Chrome Install Card ─────────────────
  return (
    <div
      className="pwa-prompt-container"
      role="region"
      aria-label="Install Web Application"
    >
      <div className="pwa-install-card">
        <button
          type="button"
          className="pwa-close-btn"
          onClick={dismissPrompt}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>

        <div className="pwa-card-header">
          <img
            src="/icons/icon-96x96.png"
            alt="Pg Dhundo"
            className="pwa-app-icon"
            width="48"
            height="48"
          />
          <div className="pwa-card-title-group">
            <h3 className="pwa-card-title">Install Pg Dhundo App</h3>
            <p className="pwa-card-subtitle">
              Instant search, offline access & direct owner contact
            </p>
          </div>
        </div>

        <div className="pwa-benefits-list">
          <span className="pwa-benefit-pill">⚡ Faster load</span>
          <span className="pwa-benefit-pill">📶 Works offline</span>
          <span className="pwa-benefit-pill">🔒 Zero brokerage</span>
        </div>

        <div className="pwa-card-actions">
          {canInstallAndroid ? (
            <button
              type="button"
              className="pwa-btn-primary"
              onClick={promptInstall}
            >
              <span>Install App</span>
              <span aria-hidden="true">⬇️</span>
            </button>
          ) : (
            <button
              type="button"
              className="pwa-btn-primary"
              onClick={dismissPrompt}
            >
              <span>Add to Home Screen</span>
            </button>
          )}

          <button
            type="button"
            className="pwa-btn-secondary"
            onClick={dismissPrompt}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
