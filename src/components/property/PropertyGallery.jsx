import React, { useState } from "react";

export function PropertyGallery({ images = [], propertyName = "Property" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="property-gallery-empty" style={{ marginBottom: "32px" }}>
        <div className="main-property-image image-placeholder" style={{ minHeight: "360px" }}>
          <span>⌂</span>
          <p>{propertyName} (No photos available)</p>
        </div>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="property-gallery" aria-label="Property photo gallery">
      {/* Main Large Image */}
      <div className="main-property-image">
        <img
          src={images[currentIndex]}
          alt={`${propertyName} photo ${currentIndex + 1} of ${images.length}`}
          id="mainPropertyImage"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-prev"
              id="galleryPrev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              ❮
            </button>
            <button
              type="button"
              className="gallery-next"
              id="galleryNext"
              onClick={handleNext}
              aria-label="Next photo"
            >
              ❯
            </button>
            <span
              className="gallery-counter"
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                background: "rgba(0, 0, 0, 0.65)",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="small-property-images" id="smallPropertyImages">
          {images.map((imgUrl, idx) => (
            <button
              key={imgUrl + idx}
              type="button"
              className={`gallery-thumb-btn ${idx === currentIndex ? "is-active" : ""}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : "false"}
            >
              <img
                src={imgUrl}
                alt={`${propertyName} thumbnail ${idx + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default PropertyGallery;

