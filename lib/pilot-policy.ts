type PilotPolicyEnv = Record<string, string | undefined>;

export function hasUnlimitedPilotPageAnalysis(env: PilotPolicyEnv = process.env) {
  return env.AUDITPRO_DEPLOYMENT_MODE === "pilot" &&
    env.AUDITPRO_PILOT_UNLIMITED_PAGES === "true";
}
