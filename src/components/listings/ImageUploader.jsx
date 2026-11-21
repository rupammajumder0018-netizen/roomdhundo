import React, { useState } from "react";
import { Camera, UploadCloud, X, Loader2 } from "lucide-react";
import { uploadPropertyMediaFile, validateMediaFile } from "../../services/storage/index.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  images = [],
  onImagesChange,
  onChange,
  userId,
  maxCount = 5,
  label = "Property Photos",
  hint = "Upload up to 5 photos (JPG, PNG, or WebP up to 5MB each).",
}) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const triggerChange = (updatedImages) => {
    if (typeof onImagesChange === "function") {
      onImagesChange(updatedImages);
    }
    if (typeof onChange === "function") {
      onChange(updatedImages);
    }
  };

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
      const effectiveUserId = userId || "property_owner";

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const validation = validateMediaFile(file);
        if (!validation.valid) {
          setErrorMsg(validation.error);
          continue;
        }

        const { publicUrl, error } = await uploadPropertyMediaFile(file, effectiveUserId, i);
        if (publicUrl) {
          newUrls.push(publicUrl);
        } else if (error) {
          // Fallback to local DataURL preview so user is never blocked if storage is offline
          console.warn("[ImageUploader] Supabase storage upload failed, using local preview fallback:", error.message);
          const dataUrl = await readFileAsDataUrl(file);
          if (dataUrl) {
            newUrls.push(dataUrl);
          } else {
            setErrorMsg(`Upload failed: ${error.message}`);
          }
        }
      }

      if (newUrls.length > 0) {
        triggerChange([...images, ...newUrls]);
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
    triggerChange(updated);
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
          <div style={{ color: "var(--rd-accent, #38A3A5)", marginBottom: "8px" }}>
            {uploading ? (
              <Loader2 size={32} className="spin-animation" />
            ) : (
              <Camera size={32} />
            )}
          </div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--rd-text, #22577A)" }}>
            {uploading ? "Uploading photos..." : "Click or tap to upload photos"}
          </p>
          <small>{hint}</small>
        </label>
      )}

      {errorMsg && (
        <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>
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
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
