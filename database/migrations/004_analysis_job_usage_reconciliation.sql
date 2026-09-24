ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS reserved_pages integer CHECK (reserved_pages IS NULL OR reserved_pages >= 0);
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_month date;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_reconciled_at timestamptz;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS usage_refunded_pages integer NOT NULL DEFAULT 0 CHECK (usage_refunded_pages >= 0);

UPDATE analysis_jobs
SET reserved_pages = page_limit
WHERE reserved_pages IS NULL;

UPDATE analysis_jobs
SET usage_month = date_trunc('month', created_at)::date
WHERE usage_month IS NULL;

CREATE INDEX IF NOT EXISTS analysis_jobs_usage_reconciliation_idx
  ON analysis_jobs(organization_id, usage_month, usage_reconciled_at);
