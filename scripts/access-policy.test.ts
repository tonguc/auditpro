import assert from "node:assert/strict";

import { authenticationRequired, publicAnalysisEnabled, publicAnalysisPageLimit } from "../lib/access-policy";

const configured = {
  DATABASE_URL: "postgresql://example.test/auditpro",
  BETTER_AUTH_SECRET: "secret",
} as unknown as NodeJS.ProcessEnv;

assert.equal(authenticationRequired(configured), true);
assert.equal(publicAnalysisEnabled(configured), false);
assert.equal(authenticationRequired({ ...configured, AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "true" }), false);
assert.equal(publicAnalysisEnabled({ AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "TRUE" } as unknown as NodeJS.ProcessEnv), false, "public access must be explicit");
assert.equal(publicAnalysisPageLimit({ AUDITPRO_PUBLIC_PAGE_LIMIT: "10" } as unknown as NodeJS.ProcessEnv), 10);
assert.equal(publicAnalysisPageLimit({ AUDITPRO_PUBLIC_PAGE_LIMIT: "999" } as unknown as NodeJS.ProcessEnv), 250);
assert.equal(publicAnalysisPageLimit({ AUDITPRO_PUBLIC_PAGE_LIMIT: "invalid" } as unknown as NodeJS.ProcessEnv), 25);

console.log("Public access policy fixtures passed.");
