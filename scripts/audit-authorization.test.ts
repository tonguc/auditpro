import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { assertCanMutateOrganization, canMutateOrganization, ForbiddenError } from "../lib/server-session";

assert.equal(canMutateOrganization("owner"), true);
assert.equal(canMutateOrganization("admin"), true);
assert.equal(canMutateOrganization("member"), true);
assert.equal(canMutateOrganization("viewer"), false);
assert.throws(() => assertCanMutateOrganization("viewer"), ForbiddenError);

const route = readFileSync(join(process.cwd(), "app", "api", "audits", "route.ts"), "utf8");

assert.match(route, /operationResponse/);
assert.match(route, /requestIdFromHeaders/);
assert.match(route, /ForbiddenError/);
assert.match(route, /parseAuditDocumentRequestBody/);
assert.match(route, /outcome:\s*"invalid_body"/);
assert.match(route, /stableLogHash\(document\.id\)/);
assert.match(route, /stableLogHash\(id\)/);
assert.doesNotMatch(route, /metadata:\s*\{[^}]*clientName/);
assert.doesNotMatch(route, /metadata:\s*\{[^}]*url/);

const firstMutationGuard = route.indexOf("assertCanMutateOrganization(organization.role);");
const bodyParse = route.indexOf("const parsedBody = await parseAuditDocumentRequestBody(request);");
const invalidDocumentCheck = route.indexOf("if (!validDocument(document))");
const deleteGuard = route.lastIndexOf("assertCanMutateOrganization(organization.role);");
const deleteIdRead = route.indexOf('request.nextUrl.searchParams.get("id")');

assert.ok(firstMutationGuard > -1, "PUT must guard organization mutation roles");
assert.ok(firstMutationGuard < invalidDocumentCheck, "PUT must authorize before parsing/storing audit documents");
assert.ok(bodyParse > firstMutationGuard, "PUT must authenticate before body parsing");
assert.ok(bodyParse < invalidDocumentCheck, "PUT must parse JSON before validating audit documents");
assert.ok(deleteGuard > -1, "DELETE must guard organization mutation roles");
assert.ok(deleteGuard < deleteIdRead, "DELETE must authorize before reading audit ids");

const app = readFileSync(join(process.cwd(), "app", "audit-app.tsx"), "utf8");
assert.match(app, /restoreDeletedAudit/);
assert.match(app, /current\.some\(\(item\) => item\.id === audit\.id\)/);
assert.match(app, /response\.status === 403/);
assert.match(app, /Viewer accounts cannot delete cloud audits/);
assert.match(app, /Cloud deletion failed\. The audit was restored on this device\./);

const page = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
assert.match(page, /productionBoundaryConfigured/);
assert.match(page, /Production authentication is not configured/);
assert.match(page, /DATABASE_URL and BETTER_AUTH_SECRET/);
assert.doesNotMatch(page, /AUDITPRO_E2E_CLOUD_MOCK/);

console.log("Audit authorization fixtures passed.");
