import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase/client.js";
import {
  fetchUserProfile,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  sendPasswordResetEmail,
  updateUserPassword,
  accountKindFromRole,
} from "../services/auth/index.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Active user ID ref to guard against race conditions
  const activeUserIdRef = useRef(null);

  /**
   * Loads or refreshes the user's profile from the database.
   */
  const loadProfile = useCallback(async (userId) => {
    if (!userId || !supabase) {
      setProfile(null);
      return null;
    }

    activeUserIdRef.current = userId;
    setIsProfileLoading(true);

    try {
      const { data, error } = await fetchUserProfile(userId);

      // Guard against race conditions if user changed while loading
      if (activeUserIdRef.current !== userId) return null;

      if (error) {
        console.warn("[Roomdhundo Auth] Error loading user profile:", error.message);
        setProfile(null);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      if (activeUserIdRef.current === userId) {
        console.error("[Roomdhundo Auth] Unexpected error fetching profile:", err);
        setProfile(null);
      }
      return null;
    } finally {
      if (activeUserIdRef.current === userId) {
        setIsProfileLoading(false);
      }
    }
  }, []);

  /**
   * Initializes session and subscribes to auth state changes.
   */
  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Initial Session Restoration
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;

        if (error) {
          console.warn("[Roomdhundo Auth] Session restoration error:", error.message);
          setAuthError(error);
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          if (activeUserIdRef.current !== initialSession.user.id) {
            await loadProfile(initialSession.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Roomdhundo Auth] Unexpected error in getSession:", err);
          setAuthError(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setAuthError(null);

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);

        // Reload profile if user changed or profile not loaded yet
        if (activeUserIdRef.current !== newSession.user.id) {
          await loadProfile(newSession.user.id);
        }
      } else {
        activeUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Authenticate via email & password
   */
  const login = async ({ email, password }) => {
    setAuthError(null);
    const { data, error } = await signInWithEmail({ email, password });
    if (error) {
      setAuthError(error);
      return { success: false, error };
    }

    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
      const userProfile = await loadProfile(data.user.id);
      return { success: true, user: data.user, session: data.session, profile: userProfile };
    }

    return { success: false, error: new Error("No user returned from login.") };
  };

  /**
   * Register a new user
   */
  const signup = async ({ email, password, fullName, role = "user" }) => {
    setAuthError(null);
    const { data, error } = await signUpWithEmail({
      email,
      password,
      fullName,
      role,
    });

    if (error) {
      setAuthError(error);
      return { success: false, error };
    }

    return {
      success: true,
      user: data?.user || null,
      session: data?.session || null,
      requiresEmailConfirmation: !data?.session,
    };
  };

  /**
   * Initiate Google OAuth
   */
  const loginWithGoogle = async ({ role = "user", redirectTo } = {}) => {
    setAuthError(null);
    const { data, error } = await signInWithGoogle({ role, redirectTo });
    if (error) {
      setAuthError(error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  /**
   * Sign out current user
   */
  const logout = async () => {
    activeUserIdRef.current = null;
    const { error } = await authSignOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    if (error) {
      console.warn("[Roomdhundo Auth] Sign out error:", error.message);
      return { success: false, error };
    }
    return { success: true };
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email, redirectTo) => {
    setAuthError(null);
    const { data, error } = await sendPasswordResetEmail(email, redirectTo);
    if (error) {
      setAuthError(error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  /**
   * Update password for active recovery session
   */
  const updatePassword = async (newPassword) => {
    setAuthError(null);
    const { data, error } = await updateUserPassword(newPassword);
    if (error) {
      setAuthError(error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  /**
   * Manually reload current user profile
   */
  const refreshProfile = async () => {
    if (user?.id) {
      return await loadProfile(user.id);
    }
    return null;
  };

  // Derive trusted role from database profile (fallback to 'user')
  const role = profile?.role ? String(profile.role).toLowerCase() : "user";
  const roleKind = accountKindFromRole(role);

  const value = {
    user,
    session,
    profile,
    role,
    roleKind,
    isLoading,
    isProfileLoading,
    authError,
    isAuthenticated: Boolean(user && session),
    isAdmin: role === "admin" || roleKind === "admin",
    isOwner: role === "owner" || roleKind === "owner",
    isAgent: role === "agent" && role !== "agent_pending",
    isPendingAgent: role === "agent_pending",
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

