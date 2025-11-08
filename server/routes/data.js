const express = require('express');
const Data = require('../models/Data');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/data/create
router.post('/create', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const data = new Data({ user: req.user.id, title, content });
    await data.save();
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/all
router.get('/all', auth, async (req, res) => {
  try {
    const items = await Data.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/data/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const item = await Data.findOne({ _id: id, user: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });

    if (title !== undefined) item.title = title;
    if (content !== undefined) item.content = content;
    await item.save();
    return res.json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/data/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Data.findOneAndDelete({ _id: id, user: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
