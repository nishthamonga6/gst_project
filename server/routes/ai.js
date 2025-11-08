const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { chatCompletion } = require('../utils/openaiClient');
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const Prediction = require('../models/Prediction');
const Invoice = require('../models/Invoice');

const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const conv = conversationId ? await Chat.findById(conversationId) : null;
    const messages = [];
    if (conv) {
      conv.messages.forEach(m => messages.push({ role: m.role, content: m.content }));
    }
    messages.push({ role: 'user', content: message });

    // quick command handling: avoid calling external AI for simple data queries
    let content = null;
    const invoicesMatch = /invoices?\s+above\s+(\d+[\d,]*)/i.exec(message);
    if (invoicesMatch) {
      const threshold = Number(String(invoicesMatch[1]).replace(/,/g, '')) || 0;
      const invs = await Invoice.find({ user: req.user.id, total: { $gt: threshold } }).limit(50).sort({ date: -1 });
      if (invs.length === 0) content = `No invoices found above ₹${threshold}`;
      else {
        content = `Found ${invs.length} invoices above ₹${threshold}:\n` + invs.map(i => `• ${i.invoiceNumber} — ₹${(i.total||0).toFixed(2)} — ${new Date(i.date).toLocaleDateString()}`).join('\n');
      }
    }

    if (!content) {
      const aiResp = await chatCompletion(messages);
      content = aiResp.choices && aiResp.choices[0] && aiResp.choices[0].message ? aiResp.choices[0].message.content : (aiResp.choices && aiResp.choices[0] && aiResp.choices[0].text) || '';
    }

    // save to chat (MongoDB)
    let chat = conv;
    if (!chat) chat = await Chat.create({ user: req.user.id, title: message, messages: [] });
    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content });
    await chat.save();

    // also append to server-side JSON for persistence
    try{
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const file = path.join(dataDir, 'chats.json');
      let existing = [];
      if (fs.existsSync(file)){
        try{ existing = JSON.parse(fs.readFileSync(file,'utf8')||'[]') }catch(e){ existing = [] }
      }
      existing.push({ _id: chat._id, user: req.user.id, createdAt: new Date(), messages: chat.messages });
      fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf8');
    }catch(e){ console.warn('Failed to write chat JSON', e) }

    if (req.logAction) await req.logAction('ai_chat', { chatId: chat._id });
    return res.json({ chatId: chat._id, content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'AI error' });
  }
});

// POST /api/ai/extract - file upload and OCR/pdf extraction
router.post('/extract', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const filePath = req.file.path;
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const data = fs.readFileSync(filePath);
      const pdfData = await pdf(data);
      text = pdfData.text;
    } else {
      // image - use tesseract
      const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'eng');
      text = ocrText;
    }

    // minimal cleanup
    text = (text || '').replace(/\r/g, '\n');

    // call AI to extract invoice fields
    const prompt = `Extract invoice fields (supplier, buyer, invoice number, date, due date, items with description, hsn, qty, unit price, tax rate, total) from the following text:\n\n${text}`;
    const aiResp = await chatCompletion([{ role: 'system', content: 'You are an invoice parser.' }, { role: 'user', content: prompt }]);
    const content = aiResp.choices && aiResp.choices[0] && aiResp.choices[0].message ? aiResp.choices[0].message.content : '';

    const doc = await Document.create({ user: req.user.id, filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, text, extract: { raw: content } });
    if (req.logAction) await req.logAction('ai_extract', { documentId: doc._id });

    return res.json({ document: doc, parsed: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Extract error' });
  }
});

// POST /api/ai/analyze
router.post('/analyze', auth, async (req, res) => {
  try {
    const { documentId, text } = req.body;
    let doc = null;
    let sourceText = text;
    if (documentId) {
      doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      sourceText = doc.text;
    }
    if (!sourceText) return res.status(400).json({ message: 'No text' });

    const prompt = `Read the following invoice/document/text and provide:\n- Summary of important points\n- Due dates (if any)\n- Amounts due\n- GST sections and tax summary\n- Suggested actions\n\nText:\n${sourceText}`;
    const aiResp = await chatCompletion([{ role: 'system', content: 'You are a helpful accountant assistant.' }, { role: 'user', content: prompt }]);
    const content = aiResp.choices && aiResp.choices[0] && aiResp.choices[0].message ? aiResp.choices[0].message.content : '';

    if (doc) {
      doc.analysis = { summary: content };
      await doc.save();
    }

    if (req.logAction) await req.logAction('ai_analyze', { documentId: doc ? doc._id : null });
    return res.json({ analysis: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Analyze error' });
  }
});

// POST /api/ai/predict
router.post('/predict', auth, async (req, res) => {
  try {
    // gather user's invoices and do a simple prompt-based forecast via AI
    const invoices = await Invoice.find({ user: req.user.id }).sort({ date: 1 }).limit(200);
    const summary = invoices.map(inv => ({ date: inv.date, total: inv.total }));
    const prompt = `Given the following historical monthly totals, forecast the next 3 months' GST liability and provide a short explanation. Data: ${JSON.stringify(summary)}`;
    const aiResp = await chatCompletion([{ role: 'system', content: 'You are a forecasting assistant.' }, { role: 'user', content: prompt }]);
    const content = aiResp.choices && aiResp.choices[0] && aiResp.choices[0].message ? aiResp.choices[0].message.content : '';

    const prediction = await Prediction.create({ user: req.user.id, type: 'gst_forecast', input: { summaryLength: summary.length }, result: { raw: content } });
    if (req.logAction) await req.logAction('ai_predict', { predictionId: prediction._id });
    return res.json({ prediction, content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Predict error' });
  }
});

module.exports = router;
