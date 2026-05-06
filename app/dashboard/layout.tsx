import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Catalog Manager",
  description: "Manage your product catalog folders and images",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
