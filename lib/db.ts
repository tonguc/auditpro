import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var auditProPool: Pool | undefined;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!global.auditProPool) {
    global.auditProPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        "postgresql://auditpro:auditpro@127.0.0.1:5432/auditpro",
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return global.auditProPool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabasePool() {
  if (!global.auditProPool) return;
  const pool = global.auditProPool;
  global.auditProPool = undefined;
  await pool.end();
}
