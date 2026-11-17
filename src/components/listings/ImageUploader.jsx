import React, { useState } from "react";
import { uploadPropertyMediaFile, validateMediaFile } from "../../services/storage/index.js";

export default function ImageUploader({
  images = [],
  onImagesChange,
  userId,
  maxCount = 5,
  label = "Property Photos",
  hint = "Upload up to 5 photos (JPG, PNG, or WebP up to 5MB each).",
}) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg("");

    const remainingSlots = maxCount - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum ${maxCount} photos allowed.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploading(true);

    try {
      const newUrls = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const validation = validateMediaFile(file);
        if (!validation.valid) {
          setErrorMsg(validation.error);
          continue;
        }

        const { publicUrl, error } = await uploadPropertyMediaFile(file, userId || "owner", i);
        if (error) {
          setErrorMsg(`Upload failed: ${error.message}`);
          break;
        } else if (publicUrl) {
          newUrls.push(publicUrl);
        }
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while uploading photos.");
    } finally {
      setUploading(false);
      // Reset input value so same files can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  return (
    <div className="wizard-form-group">
      <label>{label} ({images.length}/{maxCount})</label>
      
      {images.length < maxCount && (
        <label className="wizard-upload-dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--rd-text, #22577A)" }}>
            {uploading ? "Uploading photos..." : "Click or tap to upload photos"}
          </p>
          <small>{hint}</small>
        </label>
      )}

      {errorMsg && (
        <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>
          {errorMsg}
        </div>
      )}

      {images.length > 0 && (
        <div className="wizard-previews">
          {images.map((url, idx) => (
            <div key={`${url}-${idx}`} className="wizard-preview-card">
              <img src={url} alt={`Upload preview ${idx + 1}`} />
              <button
                type="button"
                className="wizard-preview-remove"
                onClick={() => handleRemove(idx)}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
