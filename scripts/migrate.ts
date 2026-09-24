import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PoolClient } from "pg";

import { getPool } from "../lib/db";

type MigrationRow = {
  version: string;
  checksum: string;
};

const migrationsDir = join(process.cwd(), "database", "migrations");
const lockTimeoutMs = Number(process.env.AUDITPRO_MIGRATION_LOCK_TIMEOUT_MS ?? 30_000);

function checksum(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}

function runsOutsideTransaction(sql: string) {
  return /^\s*--\s*auditpro:\s*no-transaction\b/im.test(sql);
}

async function listMigrationFiles() {
  const files = (await readdir(migrationsDir))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) throw new Error(`No migration files found in ${migrationsDir}`);
  return files;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireMigrationLock(client: PoolClient) {
  const deadline = Date.now() + lockTimeoutMs;
  while (Date.now() < deadline) {
    const lock = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext('auditpro:schema_migrations')) AS locked",
    );
    if (lock.rows[0]?.locked) return;
    await delay(250);
  }
  throw new Error(`Could not acquire migration lock within ${lockTimeoutMs}ms.`);
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('lock_timeout', $1, false)", [`${lockTimeoutMs}ms`]);
    await acquireMigrationLock(client);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = await client.query<MigrationRow>("SELECT version, checksum FROM schema_migrations");
    const appliedByVersion = new Map(applied.rows.map((row) => [row.version, row.checksum]));
    const files = await listMigrationFiles();
    let appliedCount = 0;

    for (const file of files) {
      const version = file.replace(/\.sql$/i, "");
      const sql = await readFile(join(migrationsDir, file), "utf8");
      const digest = checksum(sql);
      const existingChecksum = appliedByVersion.get(version);

      if (existingChecksum) {
        if (existingChecksum !== digest) {
          throw new Error(`Migration checksum mismatch for ${version}. Create a new migration instead of editing an applied one.`);
        }
        continue;
      }

      const started = Date.now();
      if (runsOutsideTransaction(sql)) {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
          [version, digest],
        );
      } else {
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query(
            "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
            [version, digest],
          );
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
      appliedCount += 1;
      console.log(`Applied ${version} in ${Date.now() - started}ms`);
    }

    console.log(appliedCount ? `Applied ${appliedCount} migration(s).` : "Database schema is up to date.");
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('auditpro:schema_migrations'))").catch(() => undefined);
    client.release();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
