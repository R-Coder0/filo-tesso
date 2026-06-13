// utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const cleanEnvValue = (value) => String(value || "").trim();

const getSmtpPassword = () => {
  const password = cleanEnvValue(
    process.env.SMTP_PASS || process.env.ADMIN_EMAIL_PASS
  );
  const host = cleanEnvValue(process.env.SMTP_HOST).toLowerCase();

  // Google displays app passwords in groups; SMTP expects the same 16 characters.
  return host === "smtp.gmail.com" ? password.replace(/\s+/g, "") : password;
};

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const host = cleanEnvValue(process.env.SMTP_HOST);
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: cleanEnvValue(process.env.SMTP_USER),
        pass: getSmtpPassword(),
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
        user: cleanEnvValue(process.env.ADMIN_EMAIL),
        pass: getSmtpPassword(),
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
