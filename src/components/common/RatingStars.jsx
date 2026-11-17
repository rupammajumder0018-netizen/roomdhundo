import React from "react";

export function RatingStars({ rating, reviewCount, showCount = true, size = "15px" }) {
  const numericRating = Number(rating);
  const hasRating = Number.isFinite(numericRating) && numericRating > 0;

  if (!hasRating) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "13px",
          color: "var(--rd-accent, #38A3A5)",
          fontWeight: 600,
        }}
      >
        <span aria-hidden="true">🆕</span>
        <span>New listing</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: size,
        color: "var(--rd-text, #22577A)",
      }}
      aria-label={`Rating: ${numericRating.toFixed(1)} out of 5 stars`}
    >
      <span style={{ color: "#f59e0b" }} aria-hidden="true">
        ⭐
      </span>
      <strong style={{ fontWeight: 700 }}>{numericRating.toFixed(1)}</strong>
      {showCount && reviewCount != null && (
        <span style={{ color: "var(--rd-muted, #3a6f86)", fontSize: "13px" }}>
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </span>
  );
}

export default RatingStars;

