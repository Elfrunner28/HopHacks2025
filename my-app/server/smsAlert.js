const nodemailer = require("nodemailer");
require("dotenv").config()

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",      // e.g., Gmail SMTP
  port: 465,                   // 465 for secure SSL, 587 for TLS
  secure: true,                // true for 465, false for 587
  auth: {
    user: 'sushruthrm@gmail.com', 
    pass: process.env.EMAIL_PASS,  // app password (Gmail) or real password
  },
});

// Function to send email
async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"Safe Zone" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `<p>${text}</p>`,
    });

    console.log("Email sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Email error:", err.message || err);
    return { success: false, error: err };
  }
}

module.exports = { sendEmail };