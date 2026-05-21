import { permanentRedirect } from "next/navigation";

// 308 permanent redirect — browser caches this forever after first visit,
// so subsequent visits go directly to /dashboard with zero server round-trip.
export default function Page() {
  permanentRedirect("/dashboard");
}
