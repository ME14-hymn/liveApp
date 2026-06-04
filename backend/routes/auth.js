const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ message: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, avatar',
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(400).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
  res.json({ avatar: avatarUrl });
});

router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' });
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000);
    await db.query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3', [token, expires, email]);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER, to: email,
      subject: 'TaskFlow Password Reset',
      html: `<p>Click <a href="${process.env.CLIENT_URL}/reset-password/${token}">here</a> to reset your password.</p>`,
    });
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 6 })], async (req, res) => {
  const { token, password } = req.body;
  try {
    const result = await db.query('SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()', [token]);
    if (!result.rows.length) return res.status(400).json({ message: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2', [hashed, result.rows[0].id]);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/change-password', auth, [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })], async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;