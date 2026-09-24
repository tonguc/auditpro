ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS web_search_calls integer NOT NULL DEFAULT 0 CHECK (web_search_calls >= 0);
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS cost_basis text NOT NULL DEFAULT 'unknown' CHECK (cost_basis IN ('price-table', 'fallback-rate', 'unknown'));
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS price_version text;
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS provider_cost_usd numeric(12, 6) CHECK (provider_cost_usd IS NULL OR provider_cost_usd >= 0);
