"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Folder {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Module-level cache (survives re-renders, cleared on mutation) ────────────
let _foldersCache: Folder[] | null = null;
let _fetchPromise: Promise<Folder[]> | null = null;

function invalidateCache() {
  _foldersCache = null;
  _fetchPromise = null;
}

async function fetchFoldersOnce(): Promise<Folder[]> {
  // Return cached data immediately if available
  if (_foldersCache !== null) return _foldersCache;

  // Deduplicate concurrent fetches — reuse the in-flight promise
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    const res = await fetch("/api/folders");
    if (!res.ok) throw new Error("Failed to fetch folders");
    const data = await res.json();
    _foldersCache = data.folders as Folder[];
    _fetchPromise = null;
    return _foldersCache;
  })();

  return _fetchPromise;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(_foldersCache ?? []);
  const [loading, setLoading] = useState(_foldersCache === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchFolders = useCallback(async () => {
    // If we already have cached data, show it instantly without a loading flash
    if (_foldersCache !== null) {
      setFolders(_foldersCache);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFoldersOnce();
      if (mountedRef.current) {
        setFolders(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string): Promise<Folder | null> => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create folder");
    const newFolder: Folder = data.folder;
    // Update cache and state together
    _foldersCache = _foldersCache ? [newFolder, ..._foldersCache] : [newFolder];
    setFolders((prev) => [newFolder, ...prev]);
    return newFolder;
  };

  const renameFolder = async (id: string, name: string): Promise<void> => {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to rename folder");
    const updated: Folder = data.folder;
    if (_foldersCache) {
      _foldersCache = _foldersCache.map((f) => (f._id === id ? updated : f));
    }
    setFolders((prev) => prev.map((f) => (f._id === id ? updated : f)));
  };

  const deleteFolder = async (id: string): Promise<void> => {
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete folder");
    if (_foldersCache) {
      _foldersCache = _foldersCache.filter((f) => f._id !== id);
    }
    setFolders((prev) => prev.filter((f) => f._id !== id));
  };

  return { folders, loading, error, fetchFolders, createFolder, renameFolder, deleteFolder };
}
