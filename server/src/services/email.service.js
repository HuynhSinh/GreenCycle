import nodemailer from "nodemailer";
import AppError from "../utils/AppError.js";
import { config } from "../config/index.js";

const assertEmailConfigured = () => {
  if (!config.email.smtpHost || !config.email.smtpUser || !config.email.smtpPass || !config.email.fromAddress) {
    throw new AppError("Email service is not configured", 500);
  }
};

const createTransporter = () =>
  nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPass,
    },
    tls: {
      rejectUnauthorized: config.email.tlsRejectUnauthorized,
    },
  });

export const sendEmail = async ({ to, subject, text, html }) => {
  assertEmailConfigured();

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: {
        name: config.email.fromName,
        address: config.email.fromAddress,
      },
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw new AppError(`Unable to send password reset email: ${error.message}`, 500);
  }
};

export const sendPasswordResetOtp = ({ to, otp, expiresMinutes }) =>
  sendEmail({
    to,
    subject: "GreenCycle password reset OTP",
    text: [
      "Use this OTP to reset your GreenCycle password:",
      "",
      otp,
      "",
      `This OTP expires in ${expiresMinutes} minutes.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<p>Use this OTP to reset your GreenCycle password:</p>",
      `<p style="font-size:24px;font-weight:700;letter-spacing:6px">${otp}</p>`,
      `<p>This OTP expires in ${expiresMinutes} minutes.</p>`,
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });
