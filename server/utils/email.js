const nodemailer = require('nodemailer');

// Create a sendEmail utility. Uses SMTP config from env.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || ''
  }
});

async function sendEmail({ to, subject, html, text }){
  const from = process.env.EMAIL_FROM || 'noreply@example.com';
  const msg = { from, to, subject, html, text };
  return transporter.sendMail(msg);
}

module.exports = { sendEmail };
