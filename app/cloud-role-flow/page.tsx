import { notFound } from "next/navigation";

import { AuditApp } from "../audit-app";

export const dynamic = "force-dynamic";

export default async function CloudRoleFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (
    process.env.AUDITPRO_LAUNCH_READINESS !== "true" ||
    process.env.AUDITPRO_E2E_CLOUD_MOCK !== "1" ||
    !process.env.AUDITPRO_E2E_CLOUD_MOCK_TOKEN ||
    params.token !== process.env.AUDITPRO_E2E_CLOUD_MOCK_TOKEN
  ) {
    notFound();
  }

  return <AuditApp cloudEnabled />;
}
