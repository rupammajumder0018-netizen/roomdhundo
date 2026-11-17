import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function PoliciesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <main className="policies-page" style={{ maxWidth: "860px", margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: "32px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
        Pg Dhundo Policies
      </h1>
      <p
        className="policies-lead"
        style={{ fontSize: "16px", color: "var(--rd-muted, #3a6f86)", marginBottom: "32px", lineHeight: "1.6" }}
      >
        These policies explain how Pg Dhundo works for renters and owners around MAKAUT, Jaguli, and Haringhata.
      </p>

      {/* 10% Payment Section */}
      <section
        className="policy-card"
        id="payment"
        style={{
          background: "var(--rd-surface, #fff)",
          border: "1px solid var(--rd-border, #c6ead9)",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "var(--rd-shadow)",
        }}
      >
        <h2 style={{ fontSize: "22px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
          10% One-Time Service Fee
        </h2>
        <p style={{ lineHeight: "1.6", marginBottom: "14px" }}>
          When a <strong>PG or flat</strong> stay is confirmed through Pg Dhundo, we charge a{" "}
          <strong>one-time service fee of 10% of the total rent</strong>.{" "}
          <strong>Hotel bookings are not included</strong> in this charge.
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.7", color: "var(--rd-muted, #3a6f86)" }}>
          <li>This 10% applies only to PG and flat bookings, calculated on the total rent for that booking.</li>
          <li>Hotels are not charged this 10% service fee.</li>
          <li>It is a one-time payment only. It is not charged every month after that.</li>
          <li>The fee helps Pg Dhundo connect renters with owners, verify listings, and support both sides.</li>
        </ul>
      </section>

      {/* Privacy Section */}
      <section
        className="policy-card"
        id="privacy"
        style={{
          background: "var(--rd-surface, #fff)",
          border: "1px solid var(--rd-border, #c6ead9)",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "var(--rd-shadow)",
        }}
      >
        <h2 style={{ fontSize: "22px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
          Privacy and Contact Policy
        </h2>
        <p style={{ lineHeight: "1.6", color: "var(--rd-muted, #3a6f86)" }}>
          Owner phone numbers are not shown publicly on listing pages to protect against unsolicited spam. Use{" "}
          <strong>Contact Pg Dhundo</strong> so our team can connect you. Do not share payment outside the process we
          confirm with you.
        </p>
      </section>

      {/* Accuracy Section */}
      <section
        className="policy-card"
        id="listings"
        style={{
          background: "var(--rd-surface, #fff)",
          border: "1px solid var(--rd-border, #c6ead9)",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "var(--rd-shadow)",
        }}
      >
        <h2 style={{ fontSize: "22px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
          Listings and Accuracy
        </h2>
        <p style={{ lineHeight: "1.6", color: "var(--rd-muted, #3a6f86)" }}>
          Owners must keep rent, rooms, photos, and facilities accurate. Pg Dhundo may hide or remove a listing that is
          misleading, unsafe, or violates community standards.
        </p>
      </section>

      {/* Fair Use Section */}
      <section
        className="policy-card"
        id="conduct"
        style={{
          background: "var(--rd-surface, #fff)",
          border: "1px solid var(--rd-border, #c6ead9)",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "var(--rd-shadow)",
        }}
      >
        <h2 style={{ fontSize: "22px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
          Fair Use & Conduct
        </h2>
        <p style={{ lineHeight: "1.6", color: "var(--rd-muted, #3a6f86)" }}>
          Harassment, fake enquiries, and using the platform to bypass agreed payments are not allowed. Accounts violating
          these terms are subject to immediate suspension.
        </p>
      </section>
    </main>
  );
}

export default PoliciesPage;

