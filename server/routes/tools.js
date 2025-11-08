const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GST calculator
router.post('/calculate', auth, (req, res) => {
  const { amount, rate, type } = req.body; // type: gst, reverse
  const r = parseFloat(rate || 0);
  const a = parseFloat(amount || 0);
  const tax = a * (r/100);
  const cgst = tax/2; const sgst = tax/2;
  return res.json({ amount: a, rate: r, tax, cgst, sgst, igst: 0, total: a + tax });
});

module.exports = router;
