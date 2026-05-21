import { redirect } from "next/navigation";

// Permanent redirect — browser caches this so subsequent visits
// go straight to /dashboard with zero server round-trip
export default function Page() {
  redirect("/dashboard");
}

export const dynamic = "force-static";
