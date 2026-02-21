const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const sendEmail = async (options) => {
  if (!transporter) {
    console.log('SMTP not configured — logging email instead');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@wavfd.org',
    to: options.email,
    subject: options.subject,
    text: options.message
  });
};

module.exports = sendEmail;
