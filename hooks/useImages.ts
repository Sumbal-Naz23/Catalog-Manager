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

// ─── Module-level cache (persists across re-renders and route changes) ────────
const _cache = new Map<string, CatalogImage[]>();
const _inflight = new Map<string, Promise<CatalogImage[]>>();

async function fetchFolder(folderId: string): Promise<CatalogImage[]> {
  if (_cache.has(folderId)) return _cache.get(folderId)!;
  if (_inflight.has(folderId)) return _inflight.get(folderId)!;

  const p = fetch(`/api/images?folderId=${folderId}`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => {
      const imgs = (d.images ?? []) as CatalogImage[];
      _cache.set(folderId, imgs);
      _inflight.delete(folderId);
      return imgs;
    })
    .catch((e) => {
      _inflight.delete(folderId);
      throw e;
    });

  _inflight.set(folderId, p);
  return p;
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
async function safeJson<T>(res: Response): Promise<{ data: T | null; error: string | null }> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try { return { data: await res.json() as T, error: null }; }
    catch { return { data: null, error: "Unexpected server response." }; }
  }
  const text = await res.text().catch(() => "");
  if (res.status === 413) return { data: null, error: "File too large (max 100 MB)." };
  if (res.status === 503) return { data: null, error: "Server unavailable. Try again." };
  return { data: null, error: `Request failed (${res.status}).` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useImages(folderId: string | null) {
  // Seed state directly from cache — zero loading flash on cached folders
  const [images,   setImages]   = useState<CatalogImage[]>(() => folderId ? (_cache.get(folderId) ?? []) : []);
  const [loading,  setLoading]  = useState<boolean>(() => !!folderId && !_cache.has(folderId));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // ── Single effect handles both initial load and folder switches ────────────
  // Merged into one effect to eliminate the race condition between the
  // "folder changed" effect and the "fetchImages" effect that caused
  // double renders and a brief loading flash on every folder switch.
  useEffect(() => {
    if (!folderId) {
      setImages([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Cache hit — instant, no network, no loading state
    if (_cache.has(folderId)) {
      setImages(_cache.get(folderId)!);
      setLoading(false);
      return;
    }

    // Cache miss — show spinner, fetch
    setImages([]);
    setLoading(true);
    setError(null);

    let cancelled = false;
    fetchFolder(folderId)
      .then((imgs) => {
        if (!cancelled && mounted.current) {
          setImages(imgs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && mounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load images");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [folderId]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const uploadImages = useCallback(async (
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
      setUploadProgress((p) => p.map((x, idx) => idx === i ? { ...x, status: "uploading" } : x));

      const fd = new FormData();
      fd.append("folderId", folderId);
      fd.append("images", file);
      if (productName)       fd.append("productName", productName);
      if (productPrice != null) fd.append("productPrice", String(productPrice));

      try {
        let res: Response;
        try { res = await fetch("/api/images/upload", { method: "POST", body: fd }); }
        catch { throw new Error("Network error — check your connection."); }

        const { data, error: pe } = await safeJson<{ images: CatalogImage[]; error?: string }>(res);
        if (pe || !res.ok) throw new Error(pe ?? data?.error ?? `Upload failed (${res.status})`);
        if (data?.images?.length) newImages.push(...data.images);

        setUploadProgress((p) => p.map((x, idx) => idx === i ? { ...x, status: "done" } : x));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        errors.push(`"${file.name}": ${msg}`);
        setUploadProgress((p) => p.map((x, idx) => idx === i ? { ...x, status: "error", error: msg } : x));
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => {
        const updated = [...newImages, ...prev];
        _cache.set(folderId, updated);
        return updated;
      });
    }

    setUploading(false);
    if (errors.length === files.length) throw new Error(errors[0]);
  }, [folderId]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteImage = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    const { data, error } = await safeJson<{ error?: string }>(res);
    if (!res.ok) throw new Error(error ?? data?.error ?? "Failed to delete");
    setImages((prev) => {
      const updated = prev.filter((img) => img._id !== id);
      if (folderId) _cache.set(folderId, updated);
      return updated;
    });
  }, [folderId]);

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateImage = useCallback(async (
    id: string,
    updates: { productName?: string; productPrice?: number | null; file?: File }
  ): Promise<void> => {
    let res: Response;
    try {
      if (updates.file) {
        const fd = new FormData();
        fd.append("image", updates.file);
        if (updates.productName !== undefined) fd.append("productName", updates.productName);
        if (updates.productPrice !== undefined)
          fd.append("productPrice", updates.productPrice == null ? "" : String(updates.productPrice));
        res = await fetch(`/api/images/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/images/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: updates.productName, productPrice: updates.productPrice }),
        });
      }
    } catch { throw new Error("Network error — check your connection."); }

    const { data, error } = await safeJson<{ image?: CatalogImage; error?: string }>(res);
    if (!res.ok) throw new Error(error ?? data?.error ?? `Update failed (${res.status})`);
    if (data?.image) {
      setImages((prev) => {
        const updated = prev.map((img) => img._id === id ? { ...img, ...data.image } : img);
        if (folderId) _cache.set(folderId, updated);
        return updated;
      });
    }
  }, [folderId]);

  return { images, loading, uploading, uploadProgress, error, uploadImages, deleteImage, updateImage };
}
