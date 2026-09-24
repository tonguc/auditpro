import {
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backupPath() {
  const backupDir = resolve(process.env.AUDITPRO_BACKUP_DIR ?? "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  return join(backupDir, `auditpro-${timestamp()}.sql`);
}

type BackupOptions = {
  dockerArgsPrefix?: string[];
  dockerCommand?: string;
};

export async function runBackup(options: BackupOptions = {}) {
  const outputPath = backupPath();
  const partialPath = `${outputPath}.partial`;
  const service = process.env.AUDITPRO_DB_SERVICE ?? "database";
  const database = process.env.AUDITPRO_DB_NAME ?? "auditpro";
  const user = process.env.AUDITPRO_DB_USER ?? "auditpro";
  const dockerCommand = options.dockerCommand ?? "docker";
  const dockerArgsPrefix = options.dockerArgsPrefix ?? [];

  try {
    const dump = spawn(dockerCommand, [
      ...dockerArgsPrefix,
      "compose",
      "exec",
      "-T",
      service,
      "pg_dump",
      "-U",
      user,
      "-d",
      database,
      "--format=plain",
      "--no-owner",
      "--no-privileges",
    ], {
      stdio: ["ignore", "pipe", "inherit"],
    });

    const output = createWriteStream(partialPath, { flags: "wx", mode: 0o600 });
    const dumpComplete = new Promise<number | null>((resolveProcess, reject) => {
      dump.on("error", reject);
      dump.on("close", resolveProcess);
    });

    const [code] = await Promise.all([dumpComplete, pipeline(dump.stdout, output)]);

    if (code !== 0) throw new Error(`pg_dump failed with exit code ${code}.`);
    if (statSync(partialPath).size === 0) throw new Error("pg_dump produced an empty backup.");

    renameSync(partialPath, outputPath);
  } catch (error) {
    if (existsSync(partialPath)) unlinkSync(partialPath);
    throw error;
  }
  console.log(`Backup written to ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runBackup().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
