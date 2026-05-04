import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendMail({ to, subject, html, text, replyTo }: MailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    console.warn("[mail] SMTP env missing. Email not sent.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    replyTo: replyTo || process.env.SMTP_REPLY_TO || from,
    headers: {
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
    },
  });
  return true;
}
