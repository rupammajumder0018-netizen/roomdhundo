/**
 * Roomdhundo — Supabase Storage Service
 *
 * Manages image and video media uploads to the verified `property-images` bucket.
 * Ported and verified from legacy `files6.0/script.js` (lines 4532–4622).
 */

import { supabase } from "../supabase/client.js";

export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_BUILDING_IMAGES_DEFAULT = 5;

/**
 * Sanitizes a file name for safe storage path generation.
 * Replaces non-alphanumeric characters (except dots, underscores, dashes) with underscores.
 *
 * @param {string} fileName
 * @returns {string}
 */
export function sanitizeStorageFileName(fileName) {
  return String(fileName || "unnamed_file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Generates the standardized storage path used across Roomdhundo.
 * Format: `${userId}/${Date.now()}-${index}-${safeFileName}`
 *
 * @param {string} userId
 * @param {number} [index=0]
 * @param {string} [fileName="media"]
 * @returns {string}
 */
export function generateStoragePath(userId, index = 0, fileName = "media") {
  const safeName = sanitizeStorageFileName(fileName);
  return `${userId}/${Date.now()}-${index}-${safeName}`;
}

/**
 * Retrieves the public URL for an asset path within the `property-images` bucket.
 *
 * @param {string} path
 * @returns {string|null}
 */
export function getPropertyMediaPublicUrl(path) {
  if (!supabase || !path) return null;
  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Validates a media file against Roomdhundo size and type constraints.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error?: string, isImage: boolean, isVideo: boolean }}
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided", isImage: false, isVideo: false };
  }

  const isImage = file.type ? file.type.startsWith("image/") : false;
  const isVideo = file.type ? file.type.startsWith("video/") : false;

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file type for "${file.name}". Only images and videos are allowed.`,
      isImage: false,
      isVideo: false,
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image "${file.name}" exceeds the 5MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
      isImage: true,
      isVideo: false,
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video "${file.name}" exceeds the 50MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
      isImage: false,
      isVideo: true,
    };
  }

  return { valid: true, isImage, isVideo };
}

/**
 * Uploads a single media file to the property-images bucket.
 *
 * @param {File} file
 * @param {string} userId
 * @param {number} [index=0]
 * @returns {Promise<{ publicUrl: string|null, error: Error|null }>}
 */
export async function uploadPropertyMediaFile(file, userId, index = 0) {
  if (!supabase) {
    return {
      publicUrl: null,
      error: new Error("[Roomdhundo] Cannot upload: Supabase client is not configured."),
    };
  }

  if (!userId) {
    return {
      publicUrl: null,
      error: new Error("[Roomdhundo] Cannot upload: User ID is required."),
    };
  }

  const validation = validateMediaFile(file);
  if (!validation.valid) {
    return { publicUrl: null, error: new Error(validation.error) };
  }

  const path = generateStoragePath(userId, index, file.name);

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file);

  if (uploadError) {
    return { publicUrl: null, error: uploadError };
  }

  const publicUrl = getPropertyMediaPublicUrl(path);
  return { publicUrl, error: null };
}

/**
 * Uploads a batch of property media files, separating into images and videos.
 * Matches legacy `uploadPropertyMedia` behavior.
 *
 * @param {File[]} files
 * @param {string} userId
 * @returns {Promise<{ images: string[], videos: string[], errors: Array<{ fileName: string, error: string }> }>}
 */
export async function uploadPropertyMediaBatch(files, userId) {
  const images = [];
  const videos = [];
  const errors = [];

  if (!files || !files.length || !userId) {
    return { images, videos, errors };
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const validation = validateMediaFile(file);

    if (!validation.valid) {
      errors.push({ fileName: file.name, error: validation.error });
      continue;
    }

    const { publicUrl, error } = await uploadPropertyMediaFile(file, userId, i);

    if (error || !publicUrl) {
      errors.push({
        fileName: file.name,
        error: error?.message || "Failed to retrieve public URL",
      });
      continue;
    }

    if (validation.isImage) images.push(publicUrl);
    if (validation.isVideo) videos.push(publicUrl);
  }

  return { images, videos, errors };
}

