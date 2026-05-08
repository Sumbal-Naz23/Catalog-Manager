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

export function useImages(folderId: string | null) {
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!folderId) {
      setImages([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/images?folderId=${folderId}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const uploadImages = async (files: File[], productName?: string, productPrice?: number | null): Promise<void> => {
    if (!folderId) throw new Error("No folder selected");
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("folderId", folderId);
      files.forEach((file) => formData.append("images", file));
      if (productName) formData.append("productName", productName);
      if (productPrice != null) formData.append("productPrice", String(productPrice));

      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImages((prev) => [...data.images, ...prev]);
    } catch (err) {
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete image");
      setImages((prev) => prev.filter((img) => img._id !== id));
    } catch (err) {
      throw err;
    }
  };

  const updateImage = async (
    id: string,
    updates: { productName?: string; productPrice?: number | null; file?: File }
  ): Promise<void> => {
    try {
      let res: Response;
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
          body: JSON.stringify({
            productName: updates.productName,
            productPrice: updates.productPrice,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update image");
      setImages((prev) => prev.map((img) => (img._id === id ? { ...img, ...data.image } : img)));
    } catch (err) {
      throw err;
    }
  };

  return { images, loading, uploading, error, fetchImages, uploadImages, deleteImage, updateImage };
}
