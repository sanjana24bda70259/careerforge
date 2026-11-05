import nodemailer from 'nodemailer';

const resetServiceUnavailable = () => Object.assign(new Error('Password reset email delivery is not configured or is temporarily unavailable. Please try again later.'), { status: 503, code: 'PASSWORD_RESET_EMAIL_UNAVAILABLE' });
const smtpPort = () => Number.parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = () => String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';

export function passwordResetEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM && Number.isInteger(smtpPort()));
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: smtpSecure(),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
  });
}

export async function sendPasswordResetEmail({ email, resetUrl }) {
  if (!passwordResetEmailConfigured()) throw resetServiceUnavailable();
  try {
    await createTransport().sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your CareerForge password',
      text: `We received a request to reset your CareerForge password. Open this link to choose a new password: ${resetUrl}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`,
      html: `<!doctype html><html><body style="margin:0;background:#f4f7f1;font-family:Arial,sans-serif;color:#263b26"><main style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #dce8d5;border-radius:18px;overflow:hidden"><header style="padding:28px 34px;background:#eef5e8"><strong style="font-size:22px">Career<span style="color:#668457">Forge</span></strong><p style="margin:12px 0 0;color:#57714b;font-size:12px;letter-spacing:1px">ACCOUNT SECURITY</p></header><section style="padding:32px 34px"><h1 style="margin:0 0 14px;font-size:26px">Reset your password</h1><p style="line-height:1.6;color:#586658">We received a request to reset your CareerForge password.</p><p style="margin:26px 0"><a href="${resetUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#476c3b;color:#ffffff;text-decoration:none;font-weight:bold">Choose a new password</a></p><p style="line-height:1.6;color:#586658">This link expires in one hour and can be used only once. If you did not request it, you can safely ignore this email.</p></section></main></body></html>`
    });
  } catch {
    // Do not log the reset URL, token, or SMTP credentials.
    throw resetServiceUnavailable();
  }
}
