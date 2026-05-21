import type { Metadata } from "next";
import { getFolders } from "@/lib/getFolders";
import type { Folder } from "@/hooks/useFolders";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — Catalog Manager",
  description: "Manage your product catalog folders and images",
};

// This is a Server Component — it runs on the server, fetches folders
// from MongoDB directly (no HTTP round-trip), and streams the result
// into the page HTML. The sidebar renders with real data on first paint.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch folders server-side — eliminates the client waterfall entirely
  const initialFolders: Folder[] = await getFolders();

  return (
    <DashboardClient initialFolders={initialFolders}>
      {children}
    </DashboardClient>
  );
}
