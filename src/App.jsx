import React from "react";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AppRoutes } from "./routes/AppRoutes.jsx";

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
