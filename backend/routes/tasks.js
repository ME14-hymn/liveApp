const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { status, priority, project_id, search } = req.query;
  let query = `SELECT t.*, p.name as project_name, p.color as project_color
               FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
               WHERE t.user_id = $1`;
  const params = [req.user.id];
  let i = 2;
  if (status) { query += ` AND t.status = $${i++}`; params.push(status); }
  if (priority) { query += ` AND t.priority = $${i++}`; params.push(priority); }
  if (project_id) { query += ` AND t.project_id = $${i++}`; params.push(project_id); }
  if (search) { query += ` AND t.title ILIKE $${i++}`; params.push(`%${search}%`); }
  query += ' ORDER BY t.created_at DESC';
  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Tasks error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const total = await db.query('SELECT COUNT(*)::int as count FROM tasks WHERE user_id = $1', [req.user.id]);
    const byStatus = await db.query('SELECT status, COUNT(*)::int as count FROM tasks WHERE user_id = $1 GROUP BY status', [req.user.id]);
    const byPriority = await db.query('SELECT priority, COUNT(*)::int as count FROM tasks WHERE user_id = $1 GROUP BY priority', [req.user.id]);
    const byProject = await db.query(
      `SELECT p.name, COUNT(t.id)::int as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = $1 GROUP BY p.id, p.name ORDER BY count DESC LIMIT 5`, [req.user.id]);
    const recent = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*)::int as count FROM tasks
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`, [req.user.id]);
    res.json({ total: total.rows[0].count, byStatus: byStatus.rows, byPriority: byPriority.rows, byProject: byProject.rows, recent: recent.rows });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, [body('title').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description, status, priority, due_date, project_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO tasks (user_id, project_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, project_id || null, title, description || null, status || 'todo', priority || 'medium', due_date || null]
    );
    const full = await db.query(
      `SELECT t.*, p.name as project_name, p.color as project_color
       FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = $1`, [result.rows[0].id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, [body('title').trim().notEmpty()], async (req, res) => {
  const { title, description, status, priority, due_date, project_id } = req.body;
  try {
    const check = await db.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Task not found' });
    await db.query(
      'UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, due_date=$5, project_id=$6 WHERE id=$7',
      [title, description || null, status, priority, due_date || null, project_id || null, req.params.id]
    );
    const result = await db.query(
      `SELECT t.*, p.name as project_name, p.color as project_color
       FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = $1`, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const check = await db.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Task not found' });
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;