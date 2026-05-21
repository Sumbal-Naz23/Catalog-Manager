import { redirect } from "next/navigation";

// Redirect / → /dashboard.
// force-static makes Next.js emit this as a static HTML file with a
// <meta http-equiv="refresh"> + JS redirect — no server round-trip needed.
export const dynamic = "force-static";

export default function Page() {
  redirect("/dashboard");
}
