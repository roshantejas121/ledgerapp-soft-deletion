# Pre-Refactor Hard-Delete Audit

This audit records the destructive SQL found before the soft-deletion refactor. It is intentionally committed before any schema or route changes.

## Hard deletes

| File | Line | Table affected | Permanently lost when the query runs |
| --- | ---: | --- | --- |
| `routes/users.js` | 31 | `users` (and, through the foreign-key cascade, related `accounts` and `transactions`) | The user's identity, account ownership, and transaction history are permanently removed, so an audit or recovery request cannot reconstruct the customer's financial record. |
| `routes/accounts.js` | 31 | `accounts` (and, through the foreign-key cascade, related `transactions`) | The account's balance context and every transaction attached to it are permanently removed, breaking financial history and dispute investigation. |
| `routes/transactions.js` | 31 | `transactions` | The individual credit/debit event, amount, type, description, and timestamps are permanently removed from the ledger. |

## Schema cascade review

`schema.sql` also declares `ON DELETE CASCADE` on `accounts.user_id` and `transactions.account_id`. These are not standalone `DELETE FROM` statements, but they make a parent hard delete destructive to child financial records. The refactor keeps the foreign keys for referential integrity while changing application deletes to soft deletes and explicitly soft-deleting affected descendants.

## Exclusions

No session-token, one-time-code, cache, or other temporary table exists in this codebase. Therefore, no table is excluded from the soft-delete review. All three domain tables retain financial or identity history and receive `deleted_at TIMESTAMPTZ DEFAULT NULL`.
