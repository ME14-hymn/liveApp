const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db').db;
const auth = require('../middleware/auth');

// Get all tasks (with search & filter)
router.get('/', auth, async (req, res) => {
  const { status, priority, project_id, search } = req.query;
  let query = `SELECT t.*, p.name as project_name, p.color as project_color
               FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
               WHERE t.user_id = ?`;
  const params = [req.user.id];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
  if (search) { query += ' AND t.title LIKE ?'; params.push(`%${search}%`); }
  query += ' ORDER BY t.created_at DESC';

  try {
    const [tasks] = await db.query(query, params);
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stats for dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [req.user.id]);
    const [byStatus] = await db.query(
      'SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status', [req.user.id]);
    const [byPriority] = await db.query(
      'SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY priority', [req.user.id]);
    const [byProject] = await db.query(
      `SELECT p.name, COUNT(t.id) as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = ? GROUP BY p.id ORDER BY count DESC LIMIT 5`, [req.user.id]);
    const [recent] = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM tasks
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`, [req.user.id]);

    res.json({ total: total[0].count, byStatus, byPriority, byProject, recent });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status, priority, due_date, project_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tasks (user_id, project_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, project_id || null, title, description || null,
       status || 'todo', priority || 'medium', due_date || null]
    );
    const [tasks] = await db.query(
      `SELECT t.*, p.name as project_name, p.color as project_color
       FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?`, [result.insertId]);
    res.status(201).json(tasks[0]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, [
  body('title').trim().notEmpty(),
], async (req, res) => {
  const { title, description, status, priority, due_date, project_id } = req.body;
  try {
    const [task] = await db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!task.length) return res.status(404).json({ message: 'Task not found' });

    await db.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, project_id = ? WHERE id = ?',
      [title, description || null, status, priority, due_date || null, project_id || null, req.params.id]
    );
    const [updated] = await db.query(
      `SELECT t.*, p.name as project_name, p.color as project_color
       FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const [task] = await db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!task.length) return res.status(404).json({ message: 'Task not found' });
    await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
