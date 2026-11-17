import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header.jsx";
import { Footer } from "../components/common/Footer.jsx";
import { GuestEngagementModal } from "../components/common/GuestEngagementModal.jsx";

export function RootLayout() {
  const [activeHub, setActiveHub] = useState(() => {
    return localStorage.getItem("roomdhundo-location") || "MAKAUT";
  });

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header activeHub={activeHub} onHubChange={setActiveHub} />
      <div className="main-content-area" style={{ flex: 1 }}>
        <Outlet context={{ activeHub }} />
      </div>
      <Footer />
      <GuestEngagementModal />
    </div>
  );
}

export default RootLayout;
