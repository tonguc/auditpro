ALTER TABLE ai_accounting_failures
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0);

ALTER TABLE ai_accounting_failures
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_reference_stage_idx
  ON ai_accounting_failures(organization_id, reference_id, failure_stage)
  WHERE resolved_at IS NULL AND organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_accounting_failures_unresolved_reference_stage_null_org_idx
  ON ai_accounting_failures(reference_id, failure_stage)
  WHERE resolved_at IS NULL AND organization_id IS NULL;
