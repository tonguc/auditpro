ALTER TABLE credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_credit_kind_check;

ALTER TABLE credit_ledger
  ADD CONSTRAINT credit_ledger_credit_kind_check
  CHECK (credit_kind IN ('ai_prompt', 'ai_response'));
