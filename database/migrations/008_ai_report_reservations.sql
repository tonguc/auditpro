CREATE TABLE IF NOT EXISTS ai_report_reservations (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month date NOT NULL,
  reference_id text NOT NULL,
  report_count integer NOT NULL DEFAULT 1 CHECK (report_count = 1),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, month, reference_id)
);

CREATE INDEX IF NOT EXISTS ai_report_reservations_created_idx
  ON ai_report_reservations(created_at DESC);
