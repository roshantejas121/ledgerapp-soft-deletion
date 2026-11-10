# LedgerApp - Financial Record Management API

LedgerApp is a small Express/PostgreSQL API for user accounts and financial transactions. This implementation uses timestamp-based soft deletion: normal routes expose only active records, while retained rows remain available to an authorized audit workflow.

## Live Deployment

Deployment requires a PostgreSQL service and the environment variables below. The repository is deployment-ready for Render, Railway, or any Node.js host, but no hosted URL is claimed until a service is provisioned with a database.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
npm install
cp .env.example .env
# edit DB_URL for the PostgreSQL database
psql "$DB_URL" -f schema.sql
npm test
npm start
```

## Soft-deletion behavior

- `users`, `accounts`, and `transactions` each have `deleted_at TIMESTAMPTZ DEFAULT NULL`.
- `DELETE` API calls update `deleted_at` instead of destroying rows.
- Deleting a user also soft-deletes related accounts and transactions; deleting an account also soft-deletes its transactions.
- Normal `GET` routes filter with `deleted_at IS NULL`.
- `GET /audit/deleted` intentionally returns retained deleted users, accounts, and transactions for an authorized audit/reporting process.
- Partial active-record indexes are defined in `schema.sql`.

## API endpoints

### Users

- `GET /users` — list active users
- `GET /users/:id` — get one active user
- `POST /users` — create a user
- `DELETE /users/:id` — soft-delete a user and related financial records

### Accounts

- `GET /accounts` — list active accounts
- `GET /accounts/user/:userId` — list active accounts for a user
- `POST /accounts` — create an account
- `DELETE /accounts/:id` — soft-delete an account and its transactions

### Transactions

- `GET /transactions` — list active transactions
- `GET /transactions/account/:accountId` — list active transactions for an account
- `POST /transactions` — create a transaction
- `DELETE /transactions/:id` — soft-delete a transaction

### Audit

- `GET /audit/deleted` — return rows where `deleted_at IS NOT NULL`; protect this route with authentication/authorization before production use.

## Project structure

- `app.js` — Express application and route mounting
- `db.js` — PostgreSQL connection pool
- `schema.sql` — tables, soft-delete columns, and partial indexes
- `routes/` — user, account, transaction, and audit endpoints
- `AUDIT.md` — pre-refactor destructive-query inventory
- `TRADEOFFS.md` — design, compliance, and performance reasoning
