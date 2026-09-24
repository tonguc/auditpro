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
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_accounts_user_idx ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS auth_verifications_identifier_idx ON auth_verifications(identifier);
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
