// server/test-email.js - Diagnostic & Verification Script for PENNY Real Email Delivery
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve server/.env whether executed from workspace root or inside server/
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import { getTransporter, getFromAddress } from './src/utils/receiptEmail.js';

async function main() {
  console.log('\n======================================================');
  console.log('   PENNY TRANSACTIONAL EMAIL SYSTEM DIAGNOSTIC');
  console.log('======================================================\n');

  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();

  console.log('1. Checking Environment Configuration:');
  console.log(`   - GMAIL_USER:          ${gmailUser ? gmailUser : '(Not set)'}`);
  console.log(`   - GMAIL_APP_PASSWORD:  ${gmailPass ? `••••••••••••${gmailPass.slice(-4)}` : '(Not set)'}`);
  console.log(`   - SMTP_HOST:           ${smtpHost || '(Not set)'}`);
  console.log(`   - SMTP_USER:           ${smtpUser || '(Not set)'}`);
  console.log(`   - SMTP_FROM:           ${process.env.SMTP_FROM || '(Default)'}`);

  const targetEmail = process.argv[2] || gmailUser;

  if (!gmailUser && !smtpUser) {
    console.log('\n⚠️  NO LIVE SMTP / GMAIL CREDENTIALS FOUND!');
    console.log('   Emails are currently falling back to Ethereal mock test accounts.');
    console.log('   Mock test accounts do NOT deliver messages to real inboxes like Gmail or Yahoo.\n');
    console.log('👉 HOW TO ENABLE REAL GMAIL DELIVERY:');
    console.log('   1. Go to your Google Account: https://myaccount.google.com/security');
    console.log('   2. Ensure "2-Step Verification" is ON.');
    console.log('   3. Open App Passwords: https://myaccount.google.com/apppasswords');
    console.log('   4. Enter "PENNY" as the App name and click "Create".');
    console.log('   5. Copy the 16-character password (e.g. "abcd efgh ijkl mnop").');
    console.log('   6. Add to your server/.env file:');
    console.log('      GMAIL_USER=your_email@gmail.com');
    console.log('      GMAIL_APP_PASSWORD=abcdefghijklmnop\n');
    console.log('======================================================\n');
    return;
  }

  if (!targetEmail) {
    console.log('\n❌ Please provide a recipient email address to test:');
    console.log('   Example: node server/test-email.js recipient@example.com\n');
    return;
  }

  console.log(`\n2. Initializing Transporter for: ${targetEmail}...`);
  try {
    const transporter = await getTransporter(true);
    if (!transporter) {
      console.error('❌ Failed to construct email transporter.');
      return;
    }

    console.log('3. Verifying SMTP Connection & Authentication...');
    await transporter.verify();
    console.log('   ✅ SMTP credentials successfully authenticated with mail server!\n');

    console.log(`4. Dispatching Real Test Email to: ${targetEmail}...`);
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const fromHeader = getFromAddress('PENNY Concierge');

    const mailOptions = {
      from: fromHeader,
      to: targetEmail,
      replyTo: process.env.SMTP_FROM || fromHeader,
      subject: `[PENNY Test] Reset Password Verification Code: ${testCode}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e8e7e4; color: #232220;">
          <div style="text-align: center; border-bottom: 2px solid #232220; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="letter-spacing: 0.3em; font-size: 22px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
            <p style="font-size: 11px; letter-spacing: 0.15em; color: #767471; margin-top: 4px; text-transform: uppercase;">Real Email Delivery Verification</p>
          </div>
          <p style="font-size: 14px; margin-bottom: 12px;">Hello,</p>
          <p style="font-size: 13px; color: #555350; line-height: 1.6; margin-bottom: 20px;">
            This is a real live test verification email from your <strong>PENNY Capsule Wardrobe</strong> store application.
          </p>
          <div style="background-color: #f7f6f4; border: 1px solid #e8e7e4; padding: 20px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #767471; margin-bottom: 8px; font-weight: bold;">Simulated 6-Digit Verification Code</div>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.35em; font-family: monospace; color: #232220;">${testCode}</div>
          </div>
          <p style="font-size: 12px; color: #8c837a; text-align: center; margin: 0;">
            If you received this message in your inbox, your email credentials are functioning 100% correctly!
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('   ✅ Email successfully sent and accepted by server!');
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - Destination: ${targetEmail}`);
    console.log(`   - Verification Code: ${testCode}`);
    console.log('\n📬 Check your inbox (and spam/junk folder) now.\n');
  } catch (err) {
    console.error('\n❌ SMTP Dispatch Failed:');
    console.error(`   Error Message: ${err.message}`);
    if (err.code === 'EAUTH') {
      console.error('\n👉 Authentication Error (EAUTH):');
      console.error('   Google rejected your username or app password.');
      console.error('   Ensure you generated a 16-character App Password at https://myaccount.google.com/apppasswords');
      console.error('   and not your standard personal Gmail login password.');
    }
  }
  console.log('======================================================\n');
}

main().catch(console.error);
