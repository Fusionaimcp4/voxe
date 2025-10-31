import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // Use 'true' for 465, 'false' for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Debug: Log SMTP configuration (remove in production)
console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER ? '***' : 'NOT_SET',
  pass: process.env.SMTP_PASS ? '***' : 'NOT_SET'
});

// Function to send an email
export async function sendEmail(options: EmailOptions) {
  const from = process.env.EMAIL_FROM || 'Localbox <no-reply@localboxs.com>';

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  console.log(`Email sent to ${options.to} with subject: ${options.subject}`);
}

// Function to load email templates
export async function loadEmailTemplate(templateName: string, replacements: Record<string, string>): Promise<string> {
  // Use environment-aware path - absolute path for Docker, relative for local dev
  const templatePath = process.env.NODE_ENV === 'production' 
    ? path.join('/app', 'emails', `${templateName}.html`)
    : path.join(process.cwd(), 'emails', `${templateName}.html`);
  
  let html = await fs.readFile(templatePath, 'utf-8');

  for (const key in replacements) {
    html = html.replace(new RegExp(`{{\s*${key}\s*}}`, 'g'), replacements[key]);
  }

  return html;
}






