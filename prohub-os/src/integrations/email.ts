import nodemailer from "nodemailer";
import { requireCredentials } from "./registry";

export async function sendEmail(msg: { to: string; subject: string; text: string; html?: string; attachments?: { filename: string; content: Buffer }[] }) {
  const c = await requireCredentials("smtp");
  const port = Number(c.port);
  const transporter = nodemailer.createTransport({ host: c.host, port, secure: port === 465, auth: { user: c.user, pass: c.pass } });
  const info = await transporter.sendMail({ from: c.from, ...msg });
  return { messageId: info.messageId, accepted: info.accepted };
}

export async function testSmtp() {
  const c = await requireCredentials("smtp");
  const port = Number(c.port);
  const transporter = nodemailer.createTransport({ host: c.host, port, secure: port === 465, auth: { user: c.user, pass: c.pass } });
  await transporter.verify();
  return "SMTP connection verified";
}
