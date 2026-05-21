"use client";

import { useEffect } from "react";
import type { Folder } from "@/hooks/useFolders";
import { seedFoldersCache } from "@/hooks/useFolders";

interface Props {
  initialFolders: Folder[];
  children: React.ReactNode;
}

// Seeds the module-level folders cache with server-fetched data
// BEFORE the first render of any child component.
// This means useFolders() starts with loading=false and real data —
// the sidebar shows folders immediately with zero network request.
export default function DashboardClient({ initialFolders, children }: Props) {
  // Seed synchronously before children mount
  seedFoldersCache(initialFolders);

  // Keep cache fresh: if the server data is stale after 60s, re-fetch in background
  useEffect(() => {
    const timer = setTimeout(() => {
      // Silent background refresh — doesn't show any loading state
      fetch("/api/folders")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.folders) seedFoldersCache(d.folders); })
        .catch(() => {});
    }, 60_000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
