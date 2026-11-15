import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="admin-app-layout">
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="main-content">
        <Outlet context={{ onToggleMobileMenu: () => setIsMobileMenuOpen((prev) => !prev) }} />
      </main>
    </div>
  );
}

export default AdminLayout;
