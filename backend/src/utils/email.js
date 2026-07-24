const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[EMAIL] SMTP_USER or SMTP_PASS not set — emails will be logged to console only");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false" },
  });

  return transporter;
}

const EMAIL_FROM = process.env.EMAIL_FROM || `EthioNikah <${process.env.SMTP_USER || "noreply@ethionikah.com"}>`;

function emailTemplate(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#D4AF37,#B8860B);padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#0c0a1a;font-size:22px;font-weight:700;letter-spacing:0.5px;">Ethio Nikah</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">${title}</h2>
              <div style="color:#444;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px;border-top:1px solid #eee;">
              <p style="margin:0;color:#888;font-size:12px;text-align:center;">
                This is an automated message from Ethio Nikah. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail({ to, subject, text, html, attachments }) {
  const t = getTransporter();
  const from = EMAIL_FROM;

  if (!t) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject} | ${text || ""}`);
    return;
  }

  try {
    await t.sendMail({
      from,
      to,
      subject,
      text,
      html: html || (text ? `<p>${text}</p>` : undefined),
      ...(attachments ? { attachments } : {}),
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}: ${subject}`, error.message);
    throw error;
  }
}

async function sendPasswordResetEmail(to, firstName, resetLink, attemptsRemaining) {
  const remainingText = attemptsRemaining !== undefined
    ? `<p style="margin-top:16px;padding:12px 16px;background:#fff8e1;border-radius:8px;border:1px solid #ffe082;font-size:13px;color:#795548;">You have <strong>${attemptsRemaining}</strong> password reset attempt${attemptsRemaining !== 1 ? 's' : ''} remaining in this 5-day period.</p>`
    : '';
  const html = emailTemplate(
    "Password Reset Request",
    `<p>Hi ${firstName},</p>
     <p>We received a request to reset your password for your Ethio Nikah account.</p>
     <p style="margin:24px 0;">
       <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#0c0a1a;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;">Reset Password</a>
     </p>
     <p>This link will expire in 1 hour.</p>
     ${remainingText}
     <p>If you did not request a password reset, please ignore this email.</p>`
  );
  await sendEmail({
    to,
    subject: "Password Reset — Ethio Nikah",
    text: `Hi ${firstName}, reset your password at ${resetLink}. This link expires in 1 hour.${attemptsRemaining !== undefined ? ` You have ${attemptsRemaining} attempt(s) remaining in this 5-day period.` : ''}`,
    html,
  });
}

async function sendOtpEmail(to, firstName, otp, purpose) {
  const purposeText = purpose === "phone" ? "phone verification" : purpose === "email" ? "email verification" : "your account";
  const html = emailTemplate(
    "Your Verification Code",
    `<p>Hi ${firstName},</p>
     <p>Use the following code for ${purposeText}:</p>
     <p style="margin:24px 0;text-align:center;">
       <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#D4AF37;background:#fafafa;padding:16px 32px;border-radius:12px;border:2px solid #D4AF37;">${otp}</span>
     </p>
     <p>This code will expire in 10 minutes.</p>
     <p>If you did not request this code, please ignore this email.</p>`
  );
  await sendEmail({
    to,
    subject: "Verification Code — Ethio Nikah",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    html,
  });
}

async function sendNotificationEmail(to, firstName, title, body) {
  const html = emailTemplate(
    title,
    `<p>Hi ${firstName},</p>
     <p>${body}</p>
     <p style="margin:16px 0;">
       <a href="${process.env.APP_URL || "http://localhost:3000"}/notifications" style="color:#D4AF37;font-weight:600;text-decoration:none;">View on Ethio Nikah →</a>
     </p>`
  );
  await sendEmail({
    to,
    subject: `${title} — Ethio Nikah`,
    text: `${title}: ${body}`,
    html,
  });
}

async function send2FAAlertEmail(to, firstName, action) {
  const actionLabels = { enabled: "enabled", disabled: "disabled", regenerated: "regenerated" };
  const label = actionLabels[action] || action;
  const html = emailTemplate(
    `2FA ${label.charAt(0).toUpperCase() + label.slice(1)}`,
    `<p>Hi ${firstName},</p>
     <p>Two-factor authentication was <strong>${label}</strong> on your account.</p>
     <p>If you did not do this, please contact support immediately and reset your password.</p>`
  );
  await sendEmail({
    to,
    subject: `2FA ${label.charAt(0).toUpperCase() + label.slice(1)} — Ethio Nikah`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
  sendNotificationEmail,
  send2FAAlertEmail,
};
