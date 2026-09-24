import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { auth } from "../lib/auth";

type Role = "owner" | "admin" | "member" | "viewer";

type QueryCall = {
  text: string;
  values?: unknown[];
};

const queryCalls: QueryCall[] = [];
let role: Role = "member";

const fakeClient = {
  async query(text: string, values?: unknown[]) {
    queryCalls.push({ text, values });
    if (text.includes("INSERT INTO projects")) return { rows: [{ id: "project-1" }], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  },
  release() {},
};

const fakePool = {
  async query(text: string, values?: unknown[]) {
    queryCalls.push({ text, values });
    if (text.includes("FROM memberships")) {
      return {
        rows: [{
          organization_id: "org-1",
          role,
          plan_id: "pro",
        }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 1 };
  },
  async connect() {
    return fakeClient;
  },
  async end() {},
};

const validAuditDocument = {
  id: "audit-1",
  url: "example.com",
  clientName: "Example Client",
  industry: "SaaS",
  date: "2026-08-29T00:00:00.000Z",
  results: { t1: { status: "Pass" } },
  scan: { pageLimit: 1, pagesAnalyzed: 1 },
};

async function main() {
  process.env.AUDITPRO_LOG_LEVEL = "off";
  global.auditProPool = fakePool as never;

  const originalGetSession = auth.api.getSession;
  auth.api.getSession = (async () => ({
    session: { id: "session-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000) },
    user: { id: "user-1", email: "member@example.com", name: "Member" },
  })) as typeof auth.api.getSession;

  try {
    const { DELETE, PUT } = await import("../app/api/audits/route");

    role = "member";
    const malformed = await PUT(new Request("http://localhost/api/audits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }) as NextRequest);
    assert.equal(malformed.status, 400);
    assert.equal(malformed.headers.get("Cache-Control"), "no-store");
    assert.ok(malformed.headers.get("x-auditpro-request-id"));
    assert.deepEqual(await malformed.json(), { error: "Request body must be valid JSON." });

    const invalidShape = await PUT(new Request("http://localhost/api/audits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    }) as NextRequest);
    assert.equal(invalidShape.status, 400);
    assert.equal(invalidShape.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await invalidShape.json(), { error: "Request body must be an audit document." });

    role = "viewer";
    const viewerMalformed = await PUT(new Request("http://localhost/api/audits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }) as NextRequest);
    assert.equal(viewerMalformed.status, 403);
    assert.equal(viewerMalformed.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await viewerMalformed.json(), { error: "Viewer accounts cannot modify organization audits." });

    role = "member";
    queryCalls.length = 0;
    const upsert = await PUT(new Request("http://localhost/api/audits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validAuditDocument),
    }) as NextRequest);
    assert.equal(upsert.status, 200);
    assert.equal(upsert.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await upsert.json(), { ok: true });
    assert.ok(queryCalls.some((call) => call.text.includes("INSERT INTO projects")));
    assert.ok(queryCalls.some((call) => call.text.includes("INSERT INTO audits")));

    queryCalls.length = 0;
    const deleted = await DELETE(new NextRequest("http://localhost/api/audits?id=audit-1", { method: "DELETE" }));
    assert.equal(deleted.status, 200);
    assert.equal(deleted.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await deleted.json(), { ok: true });
    assert.ok(queryCalls.some((call) => call.text.includes("DELETE FROM audits")));
  } finally {
    auth.api.getSession = originalGetSession;
    global.auditProPool = undefined;
  }

  console.log("Audit route fixtures passed.");
}

void main();
