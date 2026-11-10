const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database execution error' });
  }
});

router.get('/account/:accountId', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM transactions WHERE account_id = $1 AND deleted_at IS NULL ORDER BY id',
      [req.params.accountId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database retrieval error' });
  }
});

router.post('/', async (req, res) => {
  const { account_id, amount, type, description } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO transactions (account_id, amount, type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [account_id, amount, type, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Transaction record creation failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Transaction ID not found' });
    res.json({ message: 'Transaction soft-deleted; ledger evidence retained' });
  } catch (err) {
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

module.exports = router;
