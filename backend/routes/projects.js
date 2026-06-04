const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, COUNT(t.id)::int as task_count FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.user_id = $1 GROUP BY p.id ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Projects error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, [body('name').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description, color } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO projects (user_id, name, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, description || null, color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, [body('name').trim().notEmpty()], async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const check = await db.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Project not found' });
    const result = await db.query(
      'UPDATE projects SET name = $1, description = $2, color = $3 WHERE id = $4 RETURNING *',
      [name, description || null, color || '#6366f1', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const check = await db.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Project not found' });
    await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;