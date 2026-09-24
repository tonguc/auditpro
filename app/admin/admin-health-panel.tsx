"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import type { HealthStatus, ProductionHealth } from "@/lib/production-health";

type LoadState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; health: ProductionHealth }
  | { state: "error"; message: string };

const statusCopy: Record<HealthStatus, string> = {
  ok: "Healthy",
  warning: "Needs attention",
  error: "Action required",
};

const statusIcon = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

function formatNumber(value: number | undefined, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en", options).format(value ?? 0);
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number | undefined) {
  if (value === undefined) return "No duration";
  return `${(value / 1000).toFixed(1)}s`;
}

function formatAge(value: number | undefined) {
  if (value === undefined) return "No timestamp";
  const minutes = Math.round(value / 60_000);
  if (minutes < 60) return `${minutes}m old`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h old`;
  return `${Math.round(hours / 24)}d old`;
}

function formatBytes(value: number | undefined) {
  if (!value) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function StatusPill({ status }: { status: HealthStatus }) {
  const Icon = statusIcon[status];

  return (
    <span className={`admin-status-pill ${status}`}>
      <Icon aria-hidden="true" size={15} />
      {statusCopy[status]}
    </span>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="admin-metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{detail}</em>
    </article>
  );
}

function actionLabel(id: string) {
  return id.replaceAll("_", " ");
}

function launchGateValue(health: ProductionHealth) {
  if (!health.launch || health.launch.status === "missing") return "No report";
  return health.launch.status === "passed" ? "Passed" : "Failed";
}

function launchGateDetail(health: ProductionHealth) {
  if (!health.launch || health.launch.status === "missing") return "Run launch:readiness";
  const steps = `${formatNumber(health.launch.passedSteps)}/${formatNumber(health.launch.totalSteps)} steps`;
  const duration = formatDuration(health.launch.durationMs);
  if (health.launch.status === "failed") return `${health.launch.failedScript ?? "Unknown step"} failed`;
  return `${steps} in ${duration}; ${formatAge(health.launch.ageMs)}`;
}

export function AdminHealthPanel() {
  const [secret, setSecret] = useState("");
  const [loadState, setLoadState] = useState<LoadState>({ state: "idle" });

  const health = loadState.state === "ready" ? loadState.health : undefined;
  const actionItems = useMemo(() => {
    if (!health) return [];
    return health.checks.filter((check) => check.status !== "ok");
  }, [health]);
  const topLine = useMemo(() => {
    if (!health) return "Enter the admin secret to check production readiness.";
    const failing = health.checks.filter((check) => check.status === "error").length;
    const warnings = health.checks.filter((check) => check.status === "warning").length;
    if (failing > 0) return `${failing} critical check(s), ${warnings} warning(s).`;
    if (warnings > 0) return `${warnings} warning(s), no critical failures.`;
    return "All production health checks are green.";
  }, [health]);

  async function loadHealth() {
    const trimmedSecret = secret.trim();
    if (!trimmedSecret) {
      setLoadState({ state: "error", message: "Admin secret is required." });
      return;
    }

    setLoadState({ state: "loading" });

    try {
      const response = await fetch("/api/admin/health", {
        cache: "no-store",
        headers: {
          "x-auditpro-admin-secret": trimmedSecret,
        },
      });
      const payload = await response.json().catch(() => undefined);

      if (!response.ok) {
        setLoadState({
          state: "error",
          message: payload?.error ?? "Admin health check failed.",
        });
        return;
      }

      setLoadState({ state: "ready", health: payload as ProductionHealth });
    } catch (error) {
      setLoadState({
        state: "error",
        message: error instanceof Error ? error.message : "Admin health check failed.",
      });
    }
  }

  return (
    <main className="admin-health-shell">
      <section className="admin-health-header">
        <div>
          <span>Povlex Operations</span>
          <h1>Production health</h1>
          <p>{topLine}</p>
        </div>
        {health ? <StatusPill status={health.status} /> : null}
      </section>

      <section className="admin-access-panel" aria-label="Admin access">
        <label>
          <span>Admin secret</span>
          <div>
            <KeyRound aria-hidden="true" size={17} />
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="AUDITPRO_ADMIN_SECRET"
              autoComplete="off"
            />
          </div>
        </label>
        <button type="button" onClick={loadHealth} disabled={loadState.state === "loading"}>
          {loadState.state === "loading" ? (
            <LoaderCircle aria-hidden="true" className="admin-spin" size={16} />
          ) : (
            <RefreshCw aria-hidden="true" size={16} />
          )}
          Refresh
        </button>
      </section>

      {loadState.state === "error" ? (
        <section className="admin-alert error" role="alert">
          <XCircle aria-hidden="true" size={18} />
          <span>{loadState.message}</span>
        </section>
      ) : null}

      {health ? (
        <>
          <section className="admin-metric-grid" aria-label="Production metrics">
            <MetricTile
              label="Database"
              value={health.runtime.databaseConfigured ? "Configured" : "Local"}
              detail={health.runtime.databaseConfigured ? "Persistent mode" : "Fallback storage active"}
            />
            <MetricTile
              label="Migrations"
              value={formatNumber(health.migrations?.applied)}
              detail={health.migrations?.latest ? `Latest ${health.migrations.latest}` : health.migrations?.error ?? "No history"}
            />
            <MetricTile
              label="Worker"
              value={formatNumber((health.jobs?.queued ?? 0) + (health.jobs?.running ?? 0))}
              detail={`${formatNumber(health.jobs?.failedRecent)} failed in recent scope`}
            />
            <MetricTile
              label="Backup"
              value={health.backup?.status === "fresh" ? "Fresh" : health.backup?.status === "stale" ? "Stale" : "Missing"}
              detail={health.backup?.status === "missing" ? "Run db:backup" : `${formatAge(health.backup?.ageMs)}; ${formatBytes(health.backup?.sizeBytes)}`}
            />
            <MetricTile
              label="Launch gate"
              value={launchGateValue(health)}
              detail={launchGateDetail(health)}
            />
            <MetricTile
              label="AI cost"
              value={formatNumber(health.usage?.estimatedAiCostEur, {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 2,
              })}
              detail={`${formatNumber(health.usage?.aiPromptCredits)} prompt credits`}
            />
          </section>

          <section className="admin-action-panel" aria-label="Launch actions">
            <div className="admin-section-title">
              <AlertTriangle aria-hidden="true" size={18} />
              <h2>Launch actions</h2>
            </div>
            {actionItems.length > 0 ? (
              <ol>
                {actionItems.map((check) => (
                  <li className={check.status} key={check.id}>
                    <StatusPill status={check.status} />
                    <div>
                      <strong>{actionLabel(check.id)}</strong>
                      <p>{check.message}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="admin-action-empty">No blocking launch actions detected by the current health checks.</p>
            )}
          </section>

          <section className="admin-health-layout">
            <div className="admin-check-list">
              <div className="admin-section-title">
                <ShieldCheck aria-hidden="true" size={18} />
                <h2>Readiness checks</h2>
              </div>
              {health.checks.map((check) => (
                <article className={`admin-check-item ${check.status}`} key={check.id}>
                  <StatusPill status={check.status} />
                  <div>
                    <strong>{actionLabel(check.id)}</strong>
                    <p>{check.message}</p>
                  </div>
                </article>
              ))}
            </div>

            <aside className="admin-side-panel" aria-label="Runtime detail">
              <div className="admin-section-title">
                <ServerCog aria-hidden="true" size={18} />
                <h2>Runtime</h2>
              </div>
              <dl>
                <div>
                  <dt>Checked</dt>
                  <dd>{formatCheckedAt(health.checkedAt)}</dd>
                </div>
                <div>
                  <dt>Node env</dt>
                  <dd>{health.runtime.nodeEnv}</dd>
                </div>
                <div>
                  <dt>App URL</dt>
                  <dd>{health.runtime.appUrlConfigured ? "Configured" : "Missing"}</dd>
                </div>
                <div>
                  <dt>Auth</dt>
                  <dd>{health.runtime.authConfigured ? "Configured" : "Partial"}</dd>
                </div>
                <div>
                  <dt>Launch gate</dt>
                  <dd>{launchGateValue(health)}</dd>
                </div>
              </dl>

              <div className="admin-section-title compact">
                <WalletCards aria-hidden="true" size={18} />
                <h2>Billing and AI</h2>
              </div>
              <dl>
                <div>
                  <dt>Billing sync</dt>
                  <dd>{health.billing.adminSyncConfigured ? "Ready" : "Missing"}</dd>
                </div>
                <div>
                  <dt>Stripe webhook</dt>
                  <dd>{health.billing.stripeWebhookConfigured ? "Ready" : "Missing"}</dd>
                </div>
                <div>
                  <dt>Price mapping</dt>
                  <dd>{health.billing.stripePricesConfigured ? "Ready" : "Missing"}</dd>
                </div>
                <div>
                  <dt>AI gateway</dt>
                  <dd>{health.ai.gatewayConfigured ? "Ready" : "Missing"}</dd>
                </div>
              </dl>

              <div className="admin-section-title compact">
                <Database aria-hidden="true" size={18} />
                <h2>Usage ledger</h2>
              </div>
              <dl>
                <div>
                  <dt>Organizations</dt>
                  <dd>{formatNumber(health.usage?.currentMonthOrganizations)}</dd>
                </div>
                <div>
                  <dt>Pages crawled</dt>
                  <dd>{formatNumber(health.usage?.pagesCrawled)}</dd>
                </div>
                <div>
                  <dt>AI reports</dt>
                  <dd>{formatNumber(health.usage?.aiReports)}</dd>
                </div>
                <div>
                  <dt>AI accounting failures</dt>
                  <dd>{formatNumber(health.usage?.unresolvedAiAccountingFailures)}</dd>
                </div>
              </dl>
            </aside>
          </section>
        </>
      ) : null}
    </main>
  );
}
