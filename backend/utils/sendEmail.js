// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE === "true"), // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify().then(() => {
  console.log("Email transporter ready");
}).catch(err => {
  console.warn("Email transporter verify failed (this may be fine in dev):", err.message);
});

async function sendOTPEmail(to, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4; color:#111;">
      <h3 style="margin-bottom:0.2em;">Your verification code</h3>
      <p style="margin-top:0.2em; font-size:1.1rem;"><strong>${otp}</strong></p>
      <p style="color:#555; font-size:0.9rem; margin-top:0.6em;">This code will expire in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject: "Verify your email — your OTP",
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };
