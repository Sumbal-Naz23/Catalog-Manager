"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Folder {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Module-level cache ───────────────────────────────────────────────────────
let _cache: Folder[] | null = null;
let _inflight: Promise<Folder[]> | null = null;

async function fetchFolders(): Promise<Folder[]> {
  if (_cache !== null) return _cache;
  if (_inflight) return _inflight;

  _inflight = fetch("/api/folders")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => {
      _cache = d.folders as Folder[];
      _inflight = null;
      return _cache!;
    })
    .catch((e) => {
      _inflight = null;
      throw e;
    });

  return _inflight;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(() => _cache ?? []);
  const [loading, setLoading] = useState<boolean>(() => _cache === null);
  const [error, setError]     = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // Already cached — nothing to do
    if (_cache !== null) {
      setFolders(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchFolders()
      .then((data) => {
        if (!cancelled && mounted.current) {
          setFolders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && mounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load folders");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []); // runs once on mount

  const createFolder = useCallback(async (name: string): Promise<Folder | null> => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create folder");
    const f: Folder = data.folder;
    _cache = _cache ? [f, ..._cache] : [f];
    setFolders((prev) => [f, ...prev]);
    return f;
  }, []);

  const renameFolder = useCallback(async (id: string, name: string): Promise<void> => {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to rename folder");
    const updated: Folder = data.folder;
    if (_cache) _cache = _cache.map((f) => f._id === id ? updated : f);
    setFolders((prev) => prev.map((f) => f._id === id ? updated : f));
  }, []);

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete folder");
    if (_cache) _cache = _cache.filter((f) => f._id !== id);
    setFolders((prev) => prev.filter((f) => f._id !== id));
  }, []);

  return { folders, loading, error, createFolder, renameFolder, deleteFolder };
}
