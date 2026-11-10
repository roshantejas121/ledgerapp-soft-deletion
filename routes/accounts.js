const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database execution error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND deleted_at IS NULL ORDER BY id',
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database retrieval error' });
  }
});

router.post('/', async (req, res) => {
  const { user_id, account_type, balance } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO accounts (user_id, account_type, balance) VALUES ($1, $2, $3) RETURNING *',
      [user_id, account_type, balance]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Account creation failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    const { rowCount } = await db.query(
      'UPDATE accounts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [accountId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Account not found' });
    await db.query(
      'UPDATE transactions SET deleted_at = NOW() WHERE account_id = $1 AND deleted_at IS NULL',
      [accountId]
    );
    res.json({ message: 'Account soft-deleted; transaction history retained' });
  } catch (err) {
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

module.exports = router;
