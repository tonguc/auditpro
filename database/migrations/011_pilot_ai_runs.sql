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

CREATE INDEX IF NOT EXISTS pilot_ai_runs_created_idx ON pilot_ai_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS pilot_ai_runs_status_idx ON pilot_ai_runs(status, created_at DESC);
