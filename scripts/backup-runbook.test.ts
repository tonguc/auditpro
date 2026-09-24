import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const backupScript = readFileSync(join(process.cwd(), "scripts", "backup-postgres.ts"), "utf8");
const deployment = readFileSync(join(process.cwd(), "DEPLOYMENT.md"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");

assert.match(packageJson, /"db:backup": "tsx scripts\/backup-postgres\.ts"/);
assert.match(backupScript, /docker/);
assert.match(backupScript, /pg_dump/);
assert.match(backupScript, /--no-owner/);
assert.match(backupScript, /--no-privileges/);
assert.match(backupScript, /AUDITPRO_BACKUP_DIR/);
assert.match(backupScript, /\.partial/);
assert.match(backupScript, /renameSync/);
assert.match(backupScript, /statSync\(partialPath\)\.size === 0/);
assert.match(backupScript, /mode: 0o600/);
assert.match(backupScript, /dockerCommand \?\? "docker"/);
assert.doesNotMatch(backupScript, /psql/);
assert.doesNotMatch(backupScript, /DROP DATABASE|DROP SCHEMA|DROP TABLE/i);
assert.match(gitignore, /^backups$/m);
const dockerignore = readFileSync(join(process.cwd(), ".dockerignore"), "utf8");
assert.match(dockerignore, /^backups$/m);
assert.match(dockerignore, /^launch-readiness-reports$/m);
assert.match(deployment, /npm run db:backup/);
assert.match(deployment, /Restore is intentionally manual/);
assert.match(deployment, /--project-name auditpro-restore-drill/);
assert.match(deployment, /-v ON_ERROR_STOP=1 --single-transaction/);
assert.match(deployment, /temporarily disable Stripe webhook delivery/);
assert.match(deployment, /replay missed Stripe events/);
assert.match(deployment, /Do not restore a backup over production while Stripe webhooks or workers are actively writing\./);

console.log("Backup runbook fixtures passed.");
