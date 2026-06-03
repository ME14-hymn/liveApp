const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db').db;
const auth = require('../middleware/auth');

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT p.*, COUNT(t.id) as task_count FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO projects (user_id, name, description, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || null, color || '#6366f1']
    );
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json(projects[0]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, [
  body('name').trim().notEmpty(),
], async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const [proj] = await db.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!proj.length) return res.status(404).json({ message: 'Project not found' });

    await db.query('UPDATE projects SET name = ?, description = ?, color = ? WHERE id = ?',
      [name, description || null, color || '#6366f1', req.params.id]);
    const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const [proj] = await db.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!proj.length) return res.status(404).json({ message: 'Project not found' });
    await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
