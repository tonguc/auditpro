CREATE TABLE IF NOT EXISTS ai_accounting_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  reference_id text NOT NULL,
  failure_stage text NOT NULL,
  error_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_accounting_failures_reference_idx
  ON ai_accounting_failures(reference_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_idx
  ON ai_accounting_failures(created_at DESC)
  WHERE resolved_at IS NULL;
