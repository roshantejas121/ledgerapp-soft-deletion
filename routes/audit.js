const express = require('express');
const router = express.Router();
const db = require('../db');

// Restricted in production: this endpoint intentionally returns retained evidence.
router.get('/deleted', async (req, res) => {
  try {
    const [users, accounts, transactions] = await Promise.all([
      db.query('SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'),
      db.query('SELECT * FROM accounts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'),
      db.query('SELECT * FROM transactions WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
    ]);
    res.json({ users: users.rows, accounts: accounts.rows, transactions: transactions.rows });
  } catch (err) {
    res.status(500).json({ error: 'Audit query failed' });
  }
});

module.exports = router;
