const sendEmail = async (options) => {
  // This is a placeholder function.
  // In a real application, you would use a service like SendGrid or Mailgun to send emails.
  console.log('Sending email to:', options.email);
  console.log('Subject:', options.subject);
  console.log('Message:', options.message);
  return Promise.resolve();
};

module.exports = sendEmail;
