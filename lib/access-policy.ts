export function publicAnalysisEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED === "true";
}

export function authenticationRequired(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET) && !publicAnalysisEnabled(env);
}

export function publicAnalysisPageLimit(env: NodeJS.ProcessEnv = process.env) {
  const configured = Number(env.AUDITPRO_PUBLIC_PAGE_LIMIT ?? 25);
  if (!Number.isFinite(configured)) return 25;
  return Math.max(1, Math.min(Math.floor(configured), 250));
}
