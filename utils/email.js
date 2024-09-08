const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
  // most use services are send grid and mail gun. in this course sendGrid will be used
  // 1) create transporter
  // it is a service/server that we define to send emails eg gmail
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // activate in gmail 'less secure option'
  });
  // 2) define the email options
  const mailOptions = {
    from: 'Mecha <admin@natours.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
