import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";

export function canMutateOrganization(role: OrganizationRole) {
  return role === "owner" || role === "admin" || role === "member";
}

export function assertCanMutateOrganization(role: OrganizationRole) {
  if (!canMutateOrganization(role)) {
    throw new ForbiddenError("Viewer accounts cannot modify organization audits.");
  }
}

export async function requireOrganization(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user.id) throw new UnauthorizedError("Authentication required.");

  const membership = await query<{
    organization_id: string;
    role: OrganizationRole;
    plan_id: "free" | "pro" | "agency" | "enterprise";
  }>(
    `SELECT m.organization_id, m.role, o.plan_id
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = $1
     ORDER BY m.created_at ASC
     LIMIT 1`,
    [session.user.id],
  );

  if (!membership.rows[0]) {
    throw new UnauthorizedError("No organization is assigned to this account.");
  }

  return {
    user: session.user,
    ...membership.rows[0],
  };
}
