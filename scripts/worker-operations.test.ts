import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const worker = readFileSync(join(process.cwd(), "scripts", "analysis-worker.ts"), "utf8");
const analysisJobs = readFileSync(join(process.cwd(), "lib", "analysis-jobs.ts"), "utf8");
const compose = readFileSync(join(process.cwd(), "docker-compose.yml"), "utf8");
const deployment = readFileSync(join(process.cwd(), "DEPLOYMENT.md"), "utf8");

assert.match(worker, /process\.once\("SIGTERM"/);
assert.match(worker, /process\.once\("SIGINT"/);
assert.match(worker, /while \(!shouldStop\(\)\)/);
assert.match(analysisJobs, /touchAnalysisJobHeartbeat/);
assert.match(analysisJobs, /setInterval/);
assert.match(analysisJobs, /\.catch\(\(error\) =>/);
assert.match(analysisJobs, /analysis\.job\.heartbeat/);
assert.match(analysisJobs, /clearInterval\(heartbeat\)/);
assert.match(analysisJobs, /reconcileReservedPageUsage/);
assert.match(analysisJobs, /analysis\.job\.page_usage_reconciled/);
assert.match(analysisJobs, /GREATEST\(pages_crawled - \$2, 0\)/);
assert.match(analysisJobs, /Number\(data\.pagesAnalyzed \?\? 0\)/);
assert.match(analysisJobs, /updated_at < now\(\) - \(\$2::int \* interval '1 millisecond'\)/);
assert.match(worker, /analysis\.worker\.shutdown_requested/);
assert.match(worker, /pathToFileURL\(process\.argv\[1\]\)/);
assert.match(compose, /stop_grace_period: 35m/);
assert.match(worker, /closeDatabasePool/);
assert.match(compose, /AUDITPRO_LOG_LEVEL/);
assert.match(deployment, /Worker shutdown is graceful/);
assert.match(deployment, /updated_at heartbeat/);

console.log("Worker operation fixtures passed.");
