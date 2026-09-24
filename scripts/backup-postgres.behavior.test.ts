import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runBackup } from "./backup-postgres";

const root = mkdtempSync(join(tmpdir(), "auditpro-backup-test-"));
const binDir = join(root, "bin");
const backupDir = join(root, "backups");
const oldBackupDir = process.env.AUDITPRO_BACKUP_DIR;
const oldMode = process.env.AUDITPRO_FAKE_DOCKER_MODE;

function installFakeDocker() {
  const commandPath = join(binDir, "fake-docker.mjs");
  writeFileSync(commandPath, [
    "if (process.env.AUDITPRO_FAKE_DOCKER_MODE === 'fail') process.exit(7);",
    "if (process.env.AUDITPRO_FAKE_DOCKER_MODE === 'empty') process.exit(0);",
    "console.log('-- auditpro backup behavior test');",
    "console.log('CREATE TABLE backup_probe(id int);');",
  ].join("\n"));
  return commandPath;
}

async function expectFailure(fakeDockerPath: string, mode: "empty" | "fail", expectedMessage: RegExp) {
  process.env.AUDITPRO_FAKE_DOCKER_MODE = mode;
  await assert.rejects(
    runBackup({ dockerCommand: process.execPath, dockerArgsPrefix: [fakeDockerPath] }),
    expectedMessage,
  );
  assert.deepEqual(readdirSync(backupDir), [], `${mode} backup must not leave backup artifacts`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  try {
    mkdirp(binDir);
    mkdirp(backupDir);
    const fakeDockerPath = installFakeDocker();

    process.env.AUDITPRO_BACKUP_DIR = backupDir;
    delete process.env.AUDITPRO_FAKE_DOCKER_MODE;

    await runBackup({ dockerCommand: process.execPath, dockerArgsPrefix: [fakeDockerPath] });

    const files = readdirSync(backupDir);
    assert.equal(files.length, 1);
    assert.match(files[0], /^auditpro-.+\.sql$/);
    assert.ok(!files[0].endsWith(".partial"));

    const backupPath = join(backupDir, files[0]);
    assert.match(readFileSync(backupPath, "utf8"), /CREATE TABLE backup_probe/);
    assert.ok(statSync(backupPath).size > 0);
    if (process.platform !== "win32") {
      assert.equal(statSync(backupPath).mode & 0o777, 0o600);
    }

    rmSync(backupPath);
    await expectFailure(fakeDockerPath, "empty", /empty backup/);
    await expectFailure(fakeDockerPath, "fail", /exit code 7/);

    console.log("Backup behavior fixtures passed.");
  } finally {
    restoreEnv("AUDITPRO_BACKUP_DIR", oldBackupDir);
    restoreEnv("AUDITPRO_FAKE_DOCKER_MODE", oldMode);
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      // Windows can briefly hold command-script handles after child process exit.
    }
  }
}

function mkdirp(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
