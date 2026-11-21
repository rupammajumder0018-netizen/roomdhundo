import React from "react";
import { Link } from "react-router-dom";
import { PROPERTY_CATEGORIES } from "../../constants/categories.js";
import { CategoryIcon } from "../../components/common/CategoryIcon.jsx";

export default function ListingHubPage() {
  return (
    <div className="bg-[var(--rd-bg)] text-[var(--rd-text)] min-h-screen py-10">
      <main className="listing-hub-page" style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 20px" }}>
        <div className="listing-hub-header" style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 12px 0", color: "var(--rd-text, #22577a)" }}>
            List Your Property
          </h1>
          <p style={{ fontSize: "16px", color: "var(--rd-muted, #3a6f86)", maxWidth: "640px", margin: "0 auto" }}>
            Choose the main category that best represents your property. Our dynamic form will automatically tailor all fields, amenities, and room pricing to your business.
          </p>
        </div>

        <div
          className="listing-hub-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {PROPERTY_CATEGORIES.map((cat, index) => (
            <Link
              key={cat.id}
              to={`/list-property/create?category=${cat.id}`}
              className="listing-hub-card"
              style={{
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                background: "var(--rd-surface, #ffffff)",
                border: "2px solid var(--rd-border, #c6ead9)",
                borderRadius: "18px",
                padding: "28px 24px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ display: "inline-flex", color: cat.badgeColor || "var(--rd-accent, #38a3a5)" }}>
                  <CategoryIcon categoryId={cat.id} size={36} />
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "var(--rd-surface-soft, #f0fdf4)",
                    color: cat.badgeColor || "var(--rd-accent, #38a3a5)",
                    border: `1px solid ${cat.badgeColor || "var(--rd-accent, #38a3a5)"}`,
                  }}
                >
                  Step {index + 1}
                </span>
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--rd-text, #22577a)" }}>
                {cat.name}
              </h3>

              <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "var(--rd-muted, #3a6f86)", margin: "0 0 18px 0", flex: 1 }}>
                {cat.description}
              </p>

              <div style={{ marginTop: "auto", borderTop: "1px dashed var(--rd-border, #c6ead9)", paddingTop: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--rd-muted, #3a6f86)", marginBottom: "6px" }}>
                  Subcategories include:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {cat.subcategories.slice(1, 4).map((sub) => (
                    <span
                      key={sub}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "var(--rd-surface-soft, #f8fafc)",
                        color: "var(--rd-text, #22577a)",
                        border: "1px solid var(--rd-border, #cbd5e1)",
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subcategories.length > 4 && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        color: "var(--rd-muted, #3a6f86)",
                      }}
                    >
                      +{cat.subcategories.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "var(--rd-accent, #38a3a5)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                List {cat.shortName} →
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
