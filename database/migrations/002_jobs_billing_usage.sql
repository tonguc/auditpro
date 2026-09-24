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

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id text PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  page_limit integer NOT NULL CHECK (page_limit > 0),
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

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  credit_kind text NOT NULL CHECK (credit_kind IN ('page', 'ai_prompt', 'ai_response')),
  amount integer NOT NULL CHECK (amount >= 0),
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
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_provider_customer_idx ON subscriptions(provider, provider_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_provider_subscription_idx ON subscriptions(provider, provider_subscription_id);
CREATE INDEX IF NOT EXISTS billing_events_org_created_idx ON billing_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS usage_monthly_month_idx ON usage_monthly(month);
CREATE INDEX IF NOT EXISTS analysis_jobs_org_created_idx ON analysis_jobs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analysis_jobs_created_idx ON analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_created_idx ON analysis_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_started_idx ON analysis_jobs(status, started_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_worker_idx ON analysis_jobs(worker_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_org_month_kind_idx ON credit_ledger(organization_id, month, credit_kind);
CREATE INDEX IF NOT EXISTS credit_ledger_month_kind_idx ON credit_ledger(month, credit_kind);
CREATE INDEX IF NOT EXISTS ai_usage_events_org_created_idx ON ai_usage_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_events_created_idx ON ai_usage_events(created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_request_idx ON ai_usage_events(request_id);
