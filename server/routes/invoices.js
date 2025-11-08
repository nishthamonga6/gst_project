const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to generate simple invoice number
function genInvoiceNumber() {
  return 'INV-' + Date.now();
}

// POST /api/invoices/create
router.post('/create', auth, [
  body('items').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid data', errors: errors.array() });
  try {
    const { items, client, dueDate } = req.body;
    // Basic calculations
    let subTotal = 0, totalTax = 0;
    const calcItems = items.map(it => {
      const taxable = (it.quantity || 0) * (it.unitPrice || 0);
      const taxRate = it.taxRate || 0;
      const tax = taxable * (taxRate/100);
      let cgst=0, sgst=0, igst=0;
      // For demo, split tax equally for intra-state
      cgst = tax/2; sgst = tax/2;
      subTotal += taxable; totalTax += tax;
      return { ...it, taxableValue: taxable, cgst, sgst, igst };
    });

    const invoice = new Invoice({ invoiceNumber: genInvoiceNumber(), user: req.user.id, client, dueDate, items: calcItems, subTotal, totalTax, total: subTotal + totalTax });
    await invoice.save();
    if (req.logAction) await req.logAction('create_invoice', { invoiceId: invoice._id });
    // also persist to server-side JSON
    try{
      const fileDir = require('path').join(__dirname, '..', 'data');
      if (!require('fs').existsSync(fileDir)) require('fs').mkdirSync(fileDir, { recursive: true });
      const file = require('path').join(fileDir, 'invoices.json');
      let arr = [];
      if (require('fs').existsSync(file)){
        try{ arr = JSON.parse(require('fs').readFileSync(file,'utf8')||'[]') }catch(e){ arr = [] }
      }
      arr.unshift(invoice.toObject());
      require('fs').writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
    }catch(e){ console.warn('Failed to write invoice JSON', e) }

    return res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/invoices/all
router.get('/all', auth, async (req, res) => {
  try {
    const items = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('client');
    return res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Invoice.findOne({ _id: req.params.id, user: req.user.id }).populate('client');
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/invoices/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const item = await Invoice.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    Object.assign(item, req.body);
    await item.save();
    if (req.logAction) await req.logAction('update_invoice', { invoiceId: item._id });
    // update server JSON store
    try{
      const fileDir = require('path').join(__dirname, '..', 'data');
      const file = require('path').join(fileDir, 'invoices.json');
      if (require('fs').existsSync(file)){
        let arr = [];
        try{ arr = JSON.parse(require('fs').readFileSync(file,'utf8')||'[]') }catch(e){ arr = [] }
        const idx = arr.findIndex(a=>String(a._id) === String(item._id));
        if (idx>=0) arr[idx] = item.toObject();
        else arr.unshift(item.toObject());
        require('fs').writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
      }
    }catch(e){ console.warn('Failed to update invoice JSON', e) }

    return res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/invoices/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const item = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (req.logAction) await req.logAction('delete_invoice', { invoiceId: item._id });
    // remove from server JSON
    try{
      const fileDir = require('path').join(__dirname, '..', 'data');
      const file = require('path').join(fileDir, 'invoices.json');
      if (require('fs').existsSync(file)){
        let arr = JSON.parse(require('fs').readFileSync(file,'utf8')||'[]');
        arr = arr.filter(a=>String(a._id) !== String(item._id));
        require('fs').writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
      }
    }catch(e){ console.warn('Failed to delete invoice JSON', e) }

    return res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
