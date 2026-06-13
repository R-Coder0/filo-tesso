// utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });
    return transporter;
  }

  throw new Error("SMTP email credentials are not configured");
};

const getFromAddress = () =>
  process.env.FROM_EMAIL ||
  process.env.SMTP_USER ||
  process.env.ADMIN_EMAIL;

async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!to) throw new Error("Email recipient is required");

  return getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
    replyTo,
  });
}

async function sendOTPEmail(to, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4; color:#111;">
      <h3 style="margin-bottom:0.2em;">Your verification code</h3>
      <p style="margin-top:0.2em; font-size:1.1rem;"><strong>${otp}</strong></p>
      <p style="color:#555; font-size:0.9rem; margin-top:0.6em;">This code will expire in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Verify your email - your OTP",
    html,
  });
}

const verifyEmailTransport = () => getTransporter().verify();

module.exports = { sendEmail, sendOTPEmail, verifyEmailTransport };
