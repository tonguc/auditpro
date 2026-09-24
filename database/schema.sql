CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id text PRIMARY KEY,
  issuer text NOT NULL,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, account_id)
);

CREATE TABLE IF NOT EXISTS auth_verifications (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan_id text NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'agency', 'enterprise')),
  brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  provider_price_id text,
  plan_id text NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'agency', 'enterprise')),
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  provider_event_created timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_price_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id text NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'agency', 'enterprise'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_event_created timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS billing_events (
  provider text NOT NULL,
  event_id text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_name text NOT NULL DEFAULT '',
  domain text NOT NULL,
  industry text NOT NULL DEFAULT '',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, domain)
);

CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  requested_pages integer NOT NULL CHECK (requested_pages > 0),
  analyzed_pages integer NOT NULL DEFAULT 0,
  checked_items integer NOT NULL DEFAULT 0,
  score integer,
  grade text,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  scan jsonb NOT NULL DEFAULT '{}'::jsonb,
  workflow jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, external_id)
);

ALTER TABLE audits ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS workflow jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE audits SET external_id = id::text WHERE external_id IS NULL;
ALTER TABLE audits ALTER COLUMN external_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  checkpoint_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('Pass', 'Partial', 'Fail', 'N/A')),
  evidence text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  due_date date,
  workflow_status text NOT NULL DEFAULT 'Open',
  UNIQUE (audit_id, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS usage_monthly (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  pages_crawled integer NOT NULL DEFAULT 0,
  ai_reports integer NOT NULL DEFAULT 0,
  audits_started integer NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, month)
);

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id text PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  page_limit integer NOT NULL CHECK (page_limit > 0),
  reserved_pages integer CHECK (reserved_pages IS NULL OR reserved_pages >= 0),
  usage_month date,
  usage_reconciled_at timestamptz,
  usage_refunded_pages integer NOT NULL DEFAULT 0 CHECK (usage_refunded_pages >= 0),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  stage text NOT NULL DEFAULT 'Analysis accepted',
  result jsonb,
  error text,
  worker_id text,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS worker_id text;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0);
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS reserved_pages integer CHECK (reserved_pages IS NULL OR reserved_pages >= 0);
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_month date;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_reconciled_at timestamptz;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_refunded_pages integer NOT NULL DEFAULT 0 CHECK (usage_refunded_pages >= 0);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  credit_kind text NOT NULL CHECK (credit_kind IN ('ai_prompt', 'ai_response')),
  amount integer NOT NULL,
  reason text NOT NULL DEFAULT 'reserve',
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_id text,
  engine_id text,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  prompt_credits integer NOT NULL DEFAULT 0 CHECK (prompt_credits >= 0),
  response_credits integer NOT NULL DEFAULT 0 CHECK (response_credits >= 0),
  estimated_cost_eur numeric(12, 6) NOT NULL DEFAULT 0,
  web_search_calls integer NOT NULL DEFAULT 0 CHECK (web_search_calls >= 0),
  cost_basis text NOT NULL DEFAULT 'unknown' CHECK (cost_basis IN ('price-table', 'fallback-rate', 'unknown')),
  price_version text,
  provider_cost_usd numeric(12, 6) CHECK (provider_cost_usd IS NULL OR provider_cost_usd >= 0),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_report_reconciliations (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  reference_id text NOT NULL,
  reason text NOT NULL DEFAULT 'scan_failed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, month, reference_id)
);

CREATE TABLE IF NOT EXISTS ai_report_reservations (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  reference_id text NOT NULL,
  report_count integer NOT NULL DEFAULT 1 CHECK (report_count = 1),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, month, reference_id)
);

CREATE TABLE IF NOT EXISTS ai_accounting_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  reference_id text NOT NULL,
  failure_stage text NOT NULL,
  error_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pilot_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  target_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'completed', 'failed')),
  prompt_count integer NOT NULL CHECK (prompt_count > 0),
  engine_count integer NOT NULL CHECK (engine_count > 0),
  reserved_cost_eur numeric(12, 6) NOT NULL CHECK (reserved_cost_eur > 0),
  actual_cost_eur numeric(12, 6),
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  result jsonb,
  error_name text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_accounts_user_idx ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS auth_verifications_identifier_idx ON auth_verifications(identifier);
CREATE INDEX IF NOT EXISTS subscriptions_provider_customer_idx ON subscriptions(provider, provider_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_provider_subscription_idx ON subscriptions(provider, provider_subscription_id);
CREATE INDEX IF NOT EXISTS billing_events_org_created_idx ON billing_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_organization_idx ON projects(organization_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a1 ON a1.attrelid = t.oid AND a1.attnum = i.indkey[0]
    JOIN pg_attribute a2 ON a2.attrelid = t.oid AND a2.attnum = i.indkey[1]
    WHERE t.relname = 'audits'
      AND i.indisunique
      AND a1.attname = 'project_id'
      AND a2.attname = 'external_id'
  ) THEN
    CREATE UNIQUE INDEX audits_project_external_idx ON audits(project_id, external_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS audits_project_created_idx ON audits(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audits_status_created_idx ON audits(status, created_at);
CREATE INDEX IF NOT EXISTS findings_audit_status_idx ON findings(audit_id, status);
CREATE INDEX IF NOT EXISTS usage_monthly_month_idx ON usage_monthly(month);
CREATE INDEX IF NOT EXISTS analysis_jobs_org_created_idx ON analysis_jobs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analysis_jobs_created_idx ON analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_created_idx ON analysis_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_started_idx ON analysis_jobs(status, started_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_updated_idx ON analysis_jobs(status, updated_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_worker_idx ON analysis_jobs(worker_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS analysis_jobs_usage_reconciliation_idx ON analysis_jobs(organization_id, usage_month, usage_reconciled_at);
CREATE INDEX IF NOT EXISTS credit_ledger_org_month_kind_idx ON credit_ledger(organization_id, month, credit_kind);
CREATE INDEX IF NOT EXISTS credit_ledger_month_kind_idx ON credit_ledger(month, credit_kind);
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_reference_reason_idx
  ON credit_ledger(organization_id, month, credit_kind, reference_id, reason)
  WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_usage_events_org_created_idx ON ai_usage_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_events_created_idx ON ai_usage_events(created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_request_idx ON ai_usage_events(request_id);
CREATE INDEX IF NOT EXISTS ai_report_reconciliations_created_idx ON ai_report_reconciliations(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_report_reservations_created_idx ON ai_report_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_accounting_failures_reference_idx ON ai_accounting_failures(reference_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_idx ON ai_accounting_failures(created_at DESC) WHERE resolved_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_reference_stage_idx
  ON ai_accounting_failures(organization_id, reference_id, failure_stage)
  WHERE resolved_at IS NULL AND organization_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_reference_stage_null_org_idx
  ON ai_accounting_failures(reference_id, failure_stage)
  WHERE resolved_at IS NULL AND organization_id IS NULL;
CREATE INDEX IF NOT EXISTS pilot_ai_runs_created_idx ON pilot_ai_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS pilot_ai_runs_status_idx ON pilot_ai_runs(status, created_at DESC);
