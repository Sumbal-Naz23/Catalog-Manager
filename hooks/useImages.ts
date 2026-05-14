"use client";

import { useState, useEffect, useCallback } from "react";

export interface CatalogImage {
  _id: string;
  folderId: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  productName?: string;
  productPrice?: number | null;
  createdAt: string;
}

export interface UploadProgress {
  fileName: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
// Never throws — always returns { data, error } where error is a clean string.
async function safeJson<T>(res: Response): Promise<{ data: T | null; error: string | null }> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data = (await res.json()) as T;
      return { data, error: null };
    } catch {
      return { data: null, error: "Unexpected server response. Please try again." };
    }
  }
  // Non-JSON (plain text, HTML error page, etc.)
  const text = await res.text().catch(() => "");
  console.error("[safeJson] Non-JSON response", res.status, text.slice(0, 400));
  if (res.status === 413) return { data: null, error: "File too large. Please upload images under 100 MB each." };
  if (res.status === 503) return { data: null, error: "Server unavailable. Please try again shortly." };
  return { data: null, error: `Request failed (${res.status}). Please try again.` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useImages(folderId: string | null) {
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!folderId) { setImages([]); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/images?folderId=${folderId}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // ── Upload: one file per request to bypass body-size limits ────────────────
  const uploadImages = async (
    files: File[],
    productName?: string,
    productPrice?: number | null
  ): Promise<void> => {
    if (!folderId) throw new Error("No folder selected");

    setUploading(true);
    setUploadProgress(files.map((f) => ({ fileName: f.name, status: "pending" })));

    const newImages: CatalogImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Mark as uploading
      setUploadProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p))
      );

      const formData = new FormData();
      formData.append("folderId", folderId);
      formData.append("images", file);
      if (productName) formData.append("productName", productName);
      if (productPrice != null) formData.append("productPrice", String(productPrice));

      try {
        let res: Response;
        try {
          res = await fetch("/api/images/upload", { method: "POST", body: formData });
        } catch {
          throw new Error("Network error — check your connection and try again.");
        }

        const { data, error: parseError } = await safeJson<{ images: CatalogImage[]; error?: string }>(res);

        if (parseError || !res.ok) {
          const msg = parseError ?? data?.error ?? `Upload failed (${res.status})`;
          throw new Error(msg);
        }

        if (data?.images?.length) {
          newImages.push(...data.images);
        }

        setUploadProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        console.error(`[uploadImages] Failed for "${file.name}":`, msg);
        errors.push(`"${file.name}": ${msg}`);
        setUploadProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "error", error: msg } : p))
        );
      }
    }

    // Add all successfully uploaded images to state
    if (newImages.length > 0) {
      setImages((prev) => [...newImages, ...prev]);
    }

    setUploading(false);

    // If every file failed, throw so the caller can show a toast
    if (errors.length === files.length) {
      throw new Error(errors[0]); // surface the first error
    }
    // Partial failure — caller can inspect uploadProgress
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteImage = async (id: string): Promise<void> => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    const { data, error } = await safeJson<{ error?: string }>(res);
    if (!res.ok) throw new Error(error ?? data?.error ?? "Failed to delete image");
    setImages((prev) => prev.filter((img) => img._id !== id));
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateImage = async (
    id: string,
    updates: { productName?: string; productPrice?: number | null; file?: File }
  ): Promise<void> => {
    let res: Response;
    try {
      if (updates.file) {
        const formData = new FormData();
        formData.append("image", updates.file);
        if (updates.productName !== undefined) formData.append("productName", updates.productName);
        if (updates.productPrice !== undefined)
          formData.append("productPrice", updates.productPrice == null ? "" : String(updates.productPrice));
        res = await fetch(`/api/images/${id}`, { method: "PATCH", body: formData });
      } else {
        res = await fetch(`/api/images/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: updates.productName, productPrice: updates.productPrice }),
        });
      }
    } catch {
      throw new Error("Network error — check your connection and try again.");
    }

    const { data, error } = await safeJson<{ image?: CatalogImage; error?: string }>(res);
    if (!res.ok) throw new Error(error ?? data?.error ?? `Update failed (${res.status})`);
    if (data?.image) {
      setImages((prev) => prev.map((img) => (img._id === id ? { ...img, ...data.image } : img)));
    }
  };

  return {
    images,
    loading,
    uploading,
    uploadProgress,
    error,
    fetchImages,
    uploadImages,
    deleteImage,
    updateImage,
  };
}
