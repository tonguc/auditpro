import type { Metadata } from "next";

import { AdminHealthPanel } from "./admin-health-panel";

export const metadata: Metadata = {
  title: "Povlex Admin Health",
  description: "Operational health checks for Povlex production readiness.",
};

export default function AdminPage() {
  return <AdminHealthPanel />;
}
