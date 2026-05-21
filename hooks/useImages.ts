"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

// ─── Module-level per-folder cache ───────────────────────────────────────────
const _imagesCache = new Map<string, CatalogImage[]>();
const _fetchPromises = new Map<string, Promise<CatalogImage[]>>();

async function fetchImagesOnce(folderId: string): Promise<CatalogImage[]> {
  if (_imagesCache.has(folderId)) return _imagesCache.get(folderId)!;
  if (_fetchPromises.has(folderId)) return _fetchPromises.get(folderId)!;

  const promise = (async () => {
    const res = await fetch(`/api/images?folderId=${folderId}`);
    if (!res.ok) throw new Error("Failed to fetch images");
    const data = await res.json();
    const images = (data.images ?? []) as CatalogImage[];
    _imagesCache.set(folderId, images);
    _fetchPromises.delete(folderId);
    return images;
  })();

  _fetchPromises.set(folderId, promise);
  return promise;
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
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
  const text = await res.text().catch(() => "");
  console.error("[safeJson] Non-JSON response", res.status, text.slice(0, 400));
  if (res.status === 413) return { data: null, error: "File too large. Please upload images under 100 MB each." };
  if (res.status === 503) return { data: null, error: "Server unavailable. Please try again shortly." };
  return { data: null, error: `Request failed (${res.status}). Please try again.` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useImages(folderId: string | null) {
  // Initialise directly from cache — switching folders is instant if cached
  const [images, setImages] = useState<CatalogImage[]>(
    () => (folderId ? (_imagesCache.get(folderId) ?? []) : [])
  );
  const [loading, setLoading] = useState<boolean>(
    () => folderId !== null && !_imagesCache.has(folderId)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const prevFolderRef = useRef<string | null>(folderId);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchImages = useCallback(async () => {
    if (!folderId) {
      setImages([]);
      setLoading(false);
      return;
    }

    // Serve from cache instantly — no spinner, no flash
    if (_imagesCache.has(folderId)) {
      setImages(_imagesCache.get(folderId)!);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchImagesOnce(folderId);
      if (mountedRef.current) setImages(data);
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [folderId]);

  // When folderId changes, immediately show cached data (or clear) before fetch
  useEffect(() => {
    if (folderId !== prevFolderRef.current) {
      prevFolderRef.current = folderId;
      if (!folderId) {
        setImages([]);
        setLoading(false);
        return;
      }
      if (_imagesCache.has(folderId)) {
        // Instant — no loading state at all
        setImages(_imagesCache.get(folderId)!);
        setLoading(false);
      } else {
        // New folder not yet cached — show empty + spinner while fetching
        setImages([]);
        setLoading(true);
      }
    }
  }, [folderId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // ── Upload ──────────────────────────────────────────────────────────────────
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

        if (data?.images?.length) newImages.push(...data.images);

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

    if (newImages.length > 0) {
      setImages((prev) => {
        const updated = [...newImages, ...prev];
        _imagesCache.set(folderId, updated);
        return updated;
      });
    }

    setUploading(false);

    if (errors.length === files.length) throw new Error(errors[0]);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteImage = async (id: string): Promise<void> => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    const { data, error } = await safeJson<{ error?: string }>(res);
    if (!res.ok) throw new Error(error ?? data?.error ?? "Failed to delete image");
    setImages((prev) => {
      const updated = prev.filter((img) => img._id !== id);
      if (folderId) _imagesCache.set(folderId, updated);
      return updated;
    });
  };

  // ── Update ──────────────────────────────────────────────────────────────────
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
      setImages((prev) => {
        const updated = prev.map((img) => (img._id === id ? { ...img, ...data.image } : img));
        if (folderId) _imagesCache.set(folderId, updated);
        return updated;
      });
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
