import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";

/**
 * Hook to access the centralized authentication context.
 *
 * @returns {import("../contexts/AuthContext.jsx").AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "[Roomdhundo] useAuth must be used within an <AuthProvider> component."
    );
  }

  return context;
}

export default useAuth;

