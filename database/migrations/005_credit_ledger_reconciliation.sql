ALTER TABLE credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_amount_check;

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_reference_reason_idx
  ON credit_ledger(organization_id, month, credit_kind, reference_id, reason)
  WHERE reference_id IS NOT NULL;
