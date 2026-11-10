const express = require('express');
const router = express.Router();
const db = require('../db');

// Normal application reads expose active users only.
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database execution error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database retrieval error' });
  }
});

router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'User creation failed' });
  }
});

// Preserve the user and all related financial history while hiding it from normal reads.
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { rowCount } = await db.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });

    await db.query(
      'UPDATE accounts SET deleted_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    await db.query(
      `UPDATE transactions SET deleted_at = NOW()
       WHERE account_id IN (SELECT id FROM accounts WHERE user_id = $1)
       AND deleted_at IS NULL`,
      [userId]
    );
    res.json({ message: 'User soft-deleted; financial history retained' });
  } catch (err) {
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

module.exports = router;
