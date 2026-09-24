import { transaction } from "../lib/db";

const allowSeed = process.env.AUDITPRO_ALLOW_SEED === "true";
const allowProductionSeed = process.env.AUDITPRO_ALLOW_PRODUCTION_SEED === "true";
const allowRemoteSeed = process.env.AUDITPRO_ALLOW_REMOTE_SEED === "true";

function isLocalDatabaseUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1", "database"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function main() {
  if (!allowSeed) {
    throw new Error("Refusing to seed. Set AUDITPRO_ALLOW_SEED=true for local/demo databases only.");
  }
  if (process.env.NODE_ENV === "production" && !allowProductionSeed) {
    throw new Error("Refusing to seed a production environment.");
  }
  if (!isLocalDatabaseUrl(process.env.DATABASE_URL) && !allowRemoteSeed) {
    throw new Error("Refusing to seed a non-local database. Set AUDITPRO_ALLOW_REMOTE_SEED=true only for intentional staging/demo databases.");
  }

  const email = process.env.AUDITPRO_DEMO_EMAIL ?? "demo@auditpro.local";
  const organizationName = process.env.AUDITPRO_DEMO_ORG ?? "AuditPro Demo";

  await transaction(async (client) => {
    const user = await client.query<{ id: string }>(
      `INSERT INTO auth_users (id, name, email, email_verified)
       VALUES ('demo-user', 'Demo User', $1, true)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         email_verified = EXCLUDED.email_verified,
         updated_at = now()
       RETURNING id`,
      [email],
    );

    const organization = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, slug, plan_id)
       VALUES ($1, 'demo', 'agency')
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         plan_id = EXCLUDED.plan_id,
         updated_at = now()
       RETURNING id`,
      [organizationName],
    );

    await client.query(
      `INSERT INTO memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [organization.rows[0].id, user.rows[0].id],
    );
  });

  console.log(`Seeded demo organization for ${email}.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
