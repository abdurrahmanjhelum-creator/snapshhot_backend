const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using app password
async function createTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.APP_PASSWORD
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
}

// Send OTP email
async function sendOTPEmail(email, subject, text, html) {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.GOOGLE_USER,
      to: email,
      subject: subject || 'Your OTP Code',
      text: text || '',
      html: html || ''
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    
    throw error;
  }
}

module.exports = {
  sendOTPEmail
};
