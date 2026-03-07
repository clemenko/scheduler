const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST) {
  const port = parseInt(process.env.SMTP_PORT || '587');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' }
  });
} else if (process.env.GMAIL_USER) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });
}

async function sendEmail(options) {
  if (!transporter) {
    console.log('Email not configured — logging instead');
    console.log('To:', options.email, 'Subject:', options.subject);
    return;
  }
  const from = process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@wavfd.org';
  await transporter.sendMail({ from, to: options.email, subject: options.subject, text: options.message });
}

module.exports = sendEmail;
