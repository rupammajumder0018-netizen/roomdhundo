import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase/client.js";
import {
  exchangeOAuthCode,
  fetchUserProfile,
  upsertUserProfile,
  accountKindFromRole,
  differentEmailRoleMessage,
} from "../../services/auth/index.js";

export function AuthCallback() {
  const [statusMessage, setStatusMessage] = useState(
    "Please wait while we finish signing you in. You will be redirected automatically."
  );
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        // Check for error parameters in query or hash
        const errorCode = params.get("error") || hashParams.get("error");
        const errorDesc =
          params.get("error_description") || hashParams.get("error_description");

        if (errorCode) {
          if (isCancelled) return;
          setHasError(true);
          setStatusMessage(
            errorDesc || "Google sign-in was cancelled or encountered an error."
          );
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        const code = params.get("code");
        let session = null;

        if (code) {
          const { data, error } = await exchangeOAuthCode(code);
          if (data?.session) {
            session = data.session;
          } else {
            // Check if detectSessionInUrl already automatically exchanged the session
            const { data: currentSession } = await supabase.auth.getSession();
            if (currentSession?.session) {
              session = currentSession.session;
            } else if (error) {
              console.error("[Roomdhundo Auth] OAuth exchange error:", error);
              if (isCancelled) return;
              setHasError(true);
              setStatusMessage(
                `Authentication failed: ${error.message}. Please try again.`
              );
              setTimeout(() => navigate("/login", { replace: true }), 3000);
              return;
            }
          }
        } else if (supabase) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        // Clean URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!session?.user) {
          if (isCancelled) return;
          setHasError(true);
          setStatusMessage("Could not establish a user session. Redirecting to sign in...");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
          return;
        }

        // Read requested role from sessionStorage
        const pendingRole = sessionStorage.getItem("roomdhundo_oauth_role") || "user";
        sessionStorage.removeItem("roomdhundo_oauth_role");

        // Fetch or create profile
        let { data: profile } = await fetchUserProfile(session.user.id);

        if (!profile) {
          const googleName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "";
          const signupRole = pendingRole === "agent" ? "agent_pending" : pendingRole;

          const { data: createdProfile } = await upsertUserProfile(session.user.id, {
            full_name: googleName,
            email: session.user.email,
            role: signupRole,
          });

          profile = createdProfile;
        }

        // Check for role mismatch
        const actualKind = accountKindFromRole(profile?.role || "user");
        const wantedKind = accountKindFromRole(pendingRole);

        if (actualKind !== "admin" && wantedKind !== actualKind && profile) {
          await supabase.auth.signOut();
          if (isCancelled) return;
          setHasError(true);
          setStatusMessage(differentEmailRoleMessage(actualKind, wantedKind));
          setTimeout(() => navigate("/login", { replace: true }), 3500);
          return;
        }

        if (isCancelled) return;
        setStatusMessage("Sign in complete! Redirecting...");

        // Determine destination
        const destination = "/";
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 800);
      } catch (err) {
        console.error("[Roomdhundo Auth] Callback handling error:", err);
        if (isCancelled) return;
        setHasError(true);
        setStatusMessage("An unexpected error occurred. Returning to sign in...");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    }

    handleCallback();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  return (
    <main
      className="auth-page"
      aria-busy={!hasError}
      aria-live="polite"
    >
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-spinner" style={{ margin: "0 auto 20px" }} />
        <h1>{hasError ? "Sign-in Notice" : "Completing Google sign-in"}</h1>
        <p className="auth-subtitle" style={{ marginBottom: 0 }}>
          {statusMessage}
        </p>
      </div>
    </main>
  );
}

export default AuthCallback;

