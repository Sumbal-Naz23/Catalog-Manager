"use client";

import { useState, useEffect, useCallback } from "react";

export interface Folder {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Failed to fetch folders");
      const data = await res.json();
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string): Promise<Folder | null> => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder");
      setFolders((prev) => [data.folder, ...prev]);
      return data.folder;
    } catch (err) {
      throw err;
    }
  };

  const renameFolder = async (id: string, name: string): Promise<void> => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename folder");
      setFolders((prev) =>
        prev.map((f) => (f._id === id ? data.folder : f))
      );
    } catch (err) {
      throw err;
    }
  };

  const deleteFolder = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete folder");
      setFolders((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      throw err;
    }
  };

  return { folders, loading, error, fetchFolders, createFolder, renameFolder, deleteFolder };
}
