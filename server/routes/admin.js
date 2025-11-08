const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Admin-only middleware
async function isAdmin(req, res, next) {
  const u = await User.findById(req.user.id);
  if (!u || u.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// GET /api/admin/users
router.get('/users', auth, isAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// POST /api/admin/user/role
router.post('/user/role', auth, isAdmin, async (req, res) => {
  const { userId, role } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = role;
  await user.save();
  res.json({ message: 'Updated' });
});

module.exports = router;
