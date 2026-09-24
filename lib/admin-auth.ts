import { safeSecretMatches } from "@/lib/secret-auth";

export function authorizedAdminRequest(request: Request) {
  return safeSecretMatches(
    process.env.AUDITPRO_ADMIN_SECRET,
    request.headers.get("x-auditpro-admin-secret"),
  );
}
