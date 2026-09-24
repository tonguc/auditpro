import { isIP } from "node:net";

import { AuditApp } from "./audit-app";
import { AuthGate } from "./auth-gate";
import { authenticationRequired, publicAnalysisEnabled } from "@/lib/access-policy";

export const dynamic = "force-dynamic";

function isProductionHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return Boolean(normalized) &&
    !normalized.startsWith("replace-") &&
    !normalized.startsWith("example-") &&
    isIP(normalized) === 0 &&
    normalized.includes(".") &&
    normalized !== "localhost" &&
    !normalized.endsWith(".localhost") &&
    !normalized.endsWith(".local");
}

function isProductionUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return isProductionHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

function productionBoundaryConfigured() {
  return isProductionHost(process.env.APP_DOMAIN ?? "") ||
    isProductionUrl(process.env.APP_URL) ||
    isProductionUrl(process.env.BETTER_AUTH_URL);
}

export default function Home() {
  const publicMode = publicAnalysisEnabled();
  const authEnabled = authenticationRequired();
  const signupEnabled = process.env.AUDITPRO_SIGNUP_ENABLED === "true";
  const aiVisibilityEnabled = process.env.AUDITPRO_DEPLOYMENT_MODE === "pilot"
    && publicMode
    && process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true"
    && process.env.AUDITPRO_PILOT_AI_ENABLED === "true";

  if (productionBoundaryConfigured() && !authEnabled && !publicMode) {
    return (
      <main className="auth-page" role="alert">
        <section className="auth-panel">
          <div className="auth-brand">Povlex</div>
          <h1>Production authentication is not configured</h1>
          <p>Set DATABASE_URL and BETTER_AUTH_SECRET before opening the app.</p>
        </section>
      </main>
    );
  }

  return (
    <AuthGate enabled={authEnabled} signupEnabled={signupEnabled}>
      <AuditApp cloudEnabled={authEnabled} aiVisibilityEnabled={aiVisibilityEnabled} />
    </AuthGate>
  );
}
