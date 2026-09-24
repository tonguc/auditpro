import { betterAuth } from "better-auth";

import { getPool, query } from "@/lib/db";

const production = process.env.NODE_ENV === "production";
const secret = process.env.BETTER_AUTH_SECRET;
const signupEnabled = process.env.AUDITPRO_SIGNUP_ENABLED === "true";

if (production && process.env.DATABASE_URL && !secret) {
  throw new Error("BETTER_AUTH_SECRET is required when authentication is enabled.");
}

function slugBase(name: string, userId: string) {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `${normalized || "workspace"}-${userId.slice(0, 8)}`;
}

export const auth = betterAuth({
  database: getPool(),
  secret: secret ?? "auditpro-local-development-secret-change-before-production",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.APP_URL ??
    "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    disableSignUp: !signupEnabled,
    minPasswordLength: 10,
  },
  user: {
    modelName: "auth_users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    modelName: "auth_accounts",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "auth_verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const organizationId = crypto.randomUUID();
          await query(
            `INSERT INTO organizations (id, name, slug)
             VALUES ($1, $2, $3)
             ON CONFLICT (slug) DO NOTHING`,
            [organizationId, `${user.name}'s workspace`, slugBase(user.name, user.id)],
          );
          await query(
            `INSERT INTO memberships (organization_id, user_id, role)
             VALUES ($1, $2, 'owner')
             ON CONFLICT DO NOTHING`,
            [organizationId, user.id],
          );
        },
      },
    },
  },
});
