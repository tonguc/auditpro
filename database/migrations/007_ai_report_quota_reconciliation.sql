CREATE TABLE IF NOT EXISTS ai_report_reconciliations (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  reference_id text NOT NULL,
  reason text NOT NULL DEFAULT 'scan_failed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, month, reference_id)
);

CREATE INDEX IF NOT EXISTS ai_report_reconciliations_created_idx
  ON ai_report_reconciliations(created_at DESC);
