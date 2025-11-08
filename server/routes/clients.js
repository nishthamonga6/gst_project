const express = require('express');
const { body, validationResult } = require('express-validator');
const Client = require('../models/Client');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/clients/create
router.post('/create', auth, [ body('name').notEmpty() ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data', errors: errors.array() });
  try {
    const client = new Client({ ...req.body, createdBy: req.user.id });
    await client.save();
    if (req.logAction) await req.logAction('create_client', { clientId: client._id });
    // persist to server-side JSON
    try{
      const fs = require('fs');
      const path = require('path');
      const fileDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
      const file = path.join(fileDir, 'clients.json');
      let arr = [];
      if (fs.existsSync(file)){
        try{ arr = JSON.parse(fs.readFileSync(file,'utf8')||'[]') }catch(e){ arr = [] }
      }
      arr.unshift(client.toObject());
      fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
    }catch(e){ console.warn('Failed to write client JSON', e) }

    return res.status(201).json(client);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/clients/all
router.get('/all', auth, async (req, res) => {
  try {
    const items = await Client.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/clients/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const item = await Client.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    Object.assign(item, req.body);
    await item.save();
    if (req.logAction) await req.logAction('update_client', { clientId: item._id });
    // update server JSON
    try{
      const fs = require('fs'); const path = require('path'); const file = path.join(__dirname, '..', 'data', 'clients.json');
      if (fs.existsSync(file)){
        let arr = [];
        try{ arr = JSON.parse(fs.readFileSync(file,'utf8')||'[]') }catch(e){ arr = [] }
        const idx = arr.findIndex(a=>String(a._id) === String(item._id));
        if (idx>=0) arr[idx] = item.toObject(); else arr.unshift(item.toObject());
        fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
      }
    }catch(e){ console.warn('Failed to update client JSON', e) }

    return res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/clients/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const item = await Client.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (req.logAction) await req.logAction('delete_client', { clientId: item._id });
    // remove from server JSON
    try{
      const fs = require('fs'); const path = require('path'); const file = path.join(__dirname, '..', 'data', 'clients.json');
      if (fs.existsSync(file)){
        let arr = JSON.parse(fs.readFileSync(file,'utf8')||'[]');
        arr = arr.filter(a=>String(a._id) !== String(item._id));
        fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
      }
    }catch(e){ console.warn('Failed to delete client JSON', e) }

    return res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
