import assert from "node:assert/strict";

async function main() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const { GET, healthzResponse } = await import("../app/api/healthz/route");
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");

  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.match(body.checkedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(Object.keys(body).sort(), ["checkedAt", "status"]);

  const downResponse = await healthzResponse(true, async () => {
    throw new Error("connection failed with secret host");
  });
  assert.equal(downResponse.status, 503);
  assert.equal(downResponse.headers.get("Cache-Control"), "no-store");
  const downBody = await downResponse.json();
  assert.deepEqual(Object.keys(downBody).sort(), ["checkedAt", "status"]);
  assert.equal(downBody.status, "error");
  assert.ok(!JSON.stringify(downBody).includes("secret host"));

  if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
  console.log("Healthz fixtures passed.");
}

void main();
