# Soft-Delete Design Trade-offs

## When soft delete is the right call

1. **Customer account recovery:** A LedgerApp user can accidentally delete an account. Marking the user and related accounts with `deleted_at` hides them from normal application responses while allowing a support or recovery workflow to restore the records with `UPDATE ... SET deleted_at = NULL`.
2. **Financial history and disputes:** Transactions are evidence for chargebacks, reconciliation, tax reporting, and customer disputes. Keeping the transaction row means the original amount, type, description, and timestamp remain available even after the account is no longer active.
3. **Regulatory auditability:** A deletion request must not silently destroy the evidence needed to explain a historical balance. The `/audit/deleted` view makes the retained rows discoverable to an authorized audit process.

## When hard delete is still appropriate

LedgerApp currently has no session-token, one-time-code, cache, or temporary-record tables. If those technical tables are added later, hard deletion is appropriate for expired secrets and ephemeral cache entries because retaining them increases exposure without adding financial audit value. Hard deletion is also appropriate when a verified privacy process requires true erasure, such as a GDPR right-to-erasure request for personal data; that process must be explicit and must account for any legally required financial-record retention before purging.

The foreign keys remain `ON DELETE CASCADE` as a final database safety net, but the API no longer invokes them for ordinary user, account, or transaction deletion. Parent and child financial records are soft-deleted together so the application remains consistent without losing history.

## Compliance scenario

Suppose a cardholder disputes a debit from six months ago and a regulator asks for the complete account history, including records that were later deleted by the customer. An auditor can query `/audit/deleted` (or, in a controlled reporting job, query `users`, `accounts`, and `transactions` with `WHERE deleted_at IS NOT NULL`) and match the retained `account_id`, amount, type, description, and `deleted_at` timestamp. The normal `/transactions` route adds `WHERE deleted_at IS NULL`, so customer-facing screens stay clean, while the audit query provides the evidence trail needed to reconstruct the ledger.

## Storage and performance estimate

Assume a small LedgerApp has 10,000 active transactions and receives 500 new transactions per month. If 5% are deleted each month, approximately 300 deleted rows accumulate in six months and 600 in twelve months, increasing the table from 10,000 to roughly 16,600 rows after one year if the active population is also growing by 500 per month. Over three years, the historical table can exceed 28,000 rows even if the UI still shows only the active subset.

A query such as `SELECT * FROM transactions WHERE deleted_at IS NULL` can otherwise scan the full table as it grows. The partial indexes `idx_users_active`, `idx_accounts_active`, and `idx_transactions_active` contain only active rows, so active-record lookups avoid indexing historical rows and keep the hot working set smaller. Without these indexes, a table around 100,000 rows (for example, roughly 8 years at 1,000 new records per month) is a practical point at which repeated list and lookup scans become a measurable concern; the exact threshold depends on hardware, selectivity, and query plans. A retention/purge job should eventually archive or permanently remove rows only after legal and business retention requirements expire.
