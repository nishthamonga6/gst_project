const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ResetToken = require('../models/ResetToken');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data', errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashed });
    await user.save();

    if (req.logAction) await req.logAction('signup', { userId: user._id });
    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', [ body('email').isEmail(), body('password').notEmpty() ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data', errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const secret = process.env.JWT_SECRET || 'secret_sample';
    const token = jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || '7d' });

    // set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (req.logAction) await req.logAction('login', { userId: user._id });
    return res.json({ message: 'Logged in', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot
router.post('/forgot', [ body('email').isEmail() ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data' });
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If user exists, an email will be sent' });

    const token = crypto.randomBytes(20).toString('hex');
    await ResetToken.create({ user: user._id, token });

    const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const html = `<p>Click to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
    try { await sendEmail({ to: email, subject: 'Password reset', html }); } catch (e) { console.error('Email send failed', e.message); }

    if (req.logAction) await req.logAction('forgot_password', { userId: user._id });
    return res.json({ message: 'If user exists, an email will be sent' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
});

// POST /api/auth/reset
router.post('/reset', [ body('email').isEmail(), body('token').notEmpty(), body('password').isLength({ min: 6 }) ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data' });
  try {
    const { email, token, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid link' });
    const rt = await ResetToken.findOne({ user: user._id, token });
    if (!rt) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    await ResetToken.deleteMany({ user: user._id });
    if (req.logAction) await req.logAction('reset_password', { userId: user._id });
    return res.json({ message: 'Password reset' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.json({ message: 'Logged out' });
});

module.exports = router;
