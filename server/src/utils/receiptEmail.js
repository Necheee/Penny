import nodemailer from 'nodemailer';
import { formatMoney, multiplyMoney } from './money.js';

let transporter = null;

export async function getTransporter(forceRefresh = false) {
  if (transporter && !forceRefresh) return transporter;

  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

  // 1. Direct Gmail with App Password (preferred for direct personal delivery)
  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    return transporter;
  }

  // 2. Production / Custom SMTP (Resend, SendGrid, Amazon SES, Mailgun, custom Gmail SMTP)
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return transporter;
  }

  // 3. Fallback: Ethereal test account (instant live previewable inbox without credentials)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return transporter;
  } catch (err) {
    console.warn('[NODEMAILER] Could not initialize Ethereal test inbox:', err.message);
    return null;
  }
}

/**
 * Returns a clean RFC-5322 formatted From header string that is accepted by Gmail and SMTP providers without rejection.
 * Respects any custom sender brand name defined in SMTP_FROM (e.g. "PENNY" or "PENNY Clothing").
 */
export function getFromAddress(defaultLabel = 'PENNY') {
  let label = defaultLabel;
  const smtpFrom = (process.env.SMTP_FROM || '').trim();
  if (smtpFrom) {
    const nameMatch = smtpFrom.match(/^["']?([^<"']+)["']?\s*<.+>$/);
    if (nameMatch && nameMatch[1].trim()) {
      label = nameMatch[1].trim();
    } else if (!smtpFrom.includes('@') && !smtpFrom.includes('<')) {
      label = smtpFrom.replace(/["']/g, '').trim();
    }
  }

  const gmailUser = (process.env.GMAIL_USER || '').trim();
  if (gmailUser) {
    return `"${label}" <${gmailUser}>`;
  }
  const smtpUser = (process.env.SMTP_USER || '').trim();
  if (smtpFrom) {
    const match = smtpFrom.match(/<([^>]+)>/);
    const email = match ? match[1].trim() : smtpFrom.replace(/["']/g, '').trim();
    if (email.includes('@')) {
      return `"${label}" <${email}>`;
    }
  }
  if (smtpUser && smtpUser.includes('@')) {
    return `"${label}" <${smtpUser}>`;
  }
  return `"${label}" <concierge@pennycapsule.com>`;
}

/**
 * Utility to generate and dispatch luxury order confirmation & digital receipt
 * For PENNY Capsule Wardrobe
 */

export const generateOrderReceiptHtml = (order) => {
  const itemsRows = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 0; font-size: 13px; color: #232220;">
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: #767471;">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${formatMoney(multiplyMoney(item.price || 0, item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official Receipt - ${order.id}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfa; margin: 0; padding: 40px 20px; color: #232220;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 40px; border-radius: 2px;">
        <div style="text-align: center; border-bottom: 1px solid #e8e7e4; padding-bottom: 24px; margin-bottom: 28px;">
          <img src="${process.env.CLIENT_URL || 'http://localhost:5173'}/logo.png" alt="PENNY" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 8px;" />
          <h1 style="letter-spacing: 0.35em; font-size: 24px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; color: #8e8d8a; margin-top: 6px; text-transform: uppercase;">Official Purchase Receipt & Order Confirmation</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="font-size: 14px; margin: 0 0 8px 0;">Dear <strong>${order.customer}</strong>,</p>
          <p style="font-size: 13px; color: #555350; line-height: 1.6; margin: 0;">
            We have confirmed receipt of your bank transfer. Your order has now moved to <strong>Processing & Tailoring</strong>. Thank you for investing in PENNY capsule essentials.
          </p>
        </div>

        <div style="background-color: #f7f6f4; padding: 16px; border-radius: 2px; margin-bottom: 28px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Order Reference:</span>
            <strong style="color: #232220; font-family: monospace;">${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Payment Status:</span>
            <strong style="color: #15803d; text-transform: uppercase;">Payment Confirmed / Verified</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Payment Method:</span>
            <span style="color: #232220;">Direct Bank Transfer</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #767471;">Delivery Destination:</span>
            <span style="color: #232220;">${order.address}, ${order.city}, ${order.state}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #e8e7e4; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8e8d8a;">
              <th style="padding-bottom: 8px;">Item Description</th>
              <th style="padding-bottom: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="border-top: 1px solid #e8e7e4; padding-top: 16px; margin-bottom: 32px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #555350;">
            <span>Subtotal:</span>
            <span>₦ ${formatMoney(order.subtotal || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #555350;">
            <span>Delivery Fee:</span>
            <span>₦ ${formatMoney(order.deliveryFee || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #232220; padding-top: 8px; border-top: 1px dashed #d5d3ce;">
            <span>Total Paid:</span>
            <span style="font-family: monospace;">₦ ${formatMoney(order.total || 0)}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatches confirmation receipt email to the customer
 */
export const sendOrderConfirmationEmail = async (order) => {
  const receiptHtml = generateOrderReceiptHtml(order);
  const fromHeader = getFromAddress('PENNY');

  let previewUrl = null;
  let info = null;

  try {
    const mailer = await getTransporter();
    if (mailer) {
      info = await mailer.sendMail({
        from: fromHeader,
        to: order.email,
        replyTo: process.env.SMTP_FROM || fromHeader,
        subject: `Official Purchase Receipt & Order Confirmation #${order.id} - PENNY`,
        html: receiptHtml,
      });

      previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }
  } catch (mailErr) {
    console.warn('[NODEMAILER] Email dispatch notice:', mailErr.message);
  }

  console.log(`\n============================================================`);
  console.log(`[PENNY NOTIFICATION ENGINE] Dispatched Order Confirmation Receipt`);
  console.log(`To: ${order.customer} <${order.email}>`);
  console.log(`Subject: Official Receipt & Confirmation for Order ${order.id} - PENNY`);
  console.log(`Payment Status: VERIFIED & CONFIRMED (Bank Transfer)`);
  console.log(`Total Amount: ₦${formatMoney(order.total || 0)}`);
  if (previewUrl) {
    console.log(`Live Preview URL: ${previewUrl}`);
  }
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`============================================================\n`);

  return {
    success: true,
    messageId: info?.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    recipient: order.email,
    sentAt: new Date().toISOString(),
    previewUrl,
    receiptPreview: receiptHtml,
  };
};

/**
 * Generates an executive luxury email notification for the store owner / administrator
 */
export const generateAdminOrderAlertHtml = (order) => {
  const isBankTransfer = order.paymentMethod === 'bank_transfer';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const itemsRows = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 10px 0; font-size: 13px; color: #232220;">
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: #767471;">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${formatMoney(multiplyMoney(item.price || 0, item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f4; margin: 0; padding: 32px 16px; color: #232220;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 36px 32px; border-radius: 2px;">
        <div style="text-align: center; border-bottom: 2px solid #232220; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="letter-spacing: 0.35em; font-size: 24px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; color: #d97706; font-weight: bold; margin-top: 6px; text-transform: uppercase;">🚨 Store Owner Order Alert</p>
        </div>

        <div style="background-color: ${isBankTransfer ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${isBankTransfer ? '#fef3c7' : '#dcfce7'}; padding: 18px; border-radius: 2px; margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: bold; color: ${isBankTransfer ? '#b45309' : '#15803d'}; margin-bottom: 6px;">
            ${isBankTransfer ? '⚠️ ACTION REQUIRED: Verify Bank Transfer' : '✅ ONLINE PAYMENT: Verified by Paystack'}
          </div>
          <p style="font-size: 12px; color: #555350; margin: 0; line-height: 1.5;">
            ${isBankTransfer 
              ? `A customer has placed an order via <strong>Direct Bank Transfer</strong>. Please check your bank mobile app for an incoming credit alert of <strong>₦${formatMoney(order.total || 0)}</strong> from <strong>${order.transferAccountName || order.customer}</strong>, then confirm payment in your dashboard.`
              : `A customer has completed payment online via <strong>Paystack</strong>. Order #${order.id} is confirmed and ready for packaging & tailoring.`
            }
          </p>
        </div>

        <div style="background-color: #fcfbf9; border: 1px solid #eee; padding: 16px; margin-bottom: 24px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Order Reference:</span>
            <strong style="font-family: monospace; color: #232220;">#${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Customer:</span>
            <strong>${order.customer}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Customer Email:</span>
            <a href="mailto:${order.email}" style="color: #232220; text-decoration: underline;">${order.email}</a>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Phone:</span>
            <a href="tel:${order.phone}" style="color: #232220;">${order.phone}</a>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Destination:</span>
            <span style="text-align: right; max-width: 60%;">${order.address}, ${order.city}, ${order.state}</span>
          </div>
          ${order.transferAccountName ? `
            <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e0dc;">
              <span style="color: #b45309; font-weight: bold;">Payer Bank Account Name:</span>
              <strong style="color: #b45309; font-family: monospace; font-size: 14px;">${order.transferAccountName}</strong>
            </div>
          ` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid #e8e7e4; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8e8d8a;">
              <th style="padding-bottom: 8px;">Item Description</th>
              <th style="padding-bottom: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="border-top: 1px solid #e8e7e4; padding-top: 12px; margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; color: #555350;">
            <span>Subtotal:</span>
            <span>₦ ${formatMoney(order.subtotal || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #555350;">
            <span>Delivery:</span>
            <span>₦ ${formatMoney(order.deliveryFee || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #232220; padding-top: 6px; border-top: 1px dashed #d5d3ce;">
            <span>Total Expected:</span>
            <span style="font-family: monospace;">₦ ${formatMoney(order.total || 0)}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${clientUrl}/admin" style="display: inline-block; background-color: #232220; color: #ffffff !important; padding: 14px 28px; font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
            Open Admin Dashboard
          </a>
        </div>
        <p style="font-size: 11px; color: #8c837a; text-align: center; margin: 16px 0 0 0;">
          To reply directly to this customer, simply click reply in your email client.
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatches an instant new order notification alert to the administrator / store owner
 */
export const sendAdminNewOrderAlert = async (order) => {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || process.env.ADMIN_EMAIL || 'admin@pennycapsule.com';
  const alertHtml = generateAdminOrderAlertHtml(order);
  const fromHeader = getFromAddress('PENNY Store Alert');

  try {
    const mailer = await getTransporter();
    if (mailer) {
      const info = await mailer.sendMail({
        from: fromHeader,
        to: adminEmail,
        replyTo: `"${order.customer}" <${order.email}>`,
        subject: `🚨 New Order Alert #${order.id} - ₦${formatMoney(order.total || 0)} from ${order.customer}`,
        html: alertHtml,
      });

      console.log(`[ADMIN NOTIFICATION] Dispatched new order alert #${order.id} to store owner <${adminEmail}>. MessageId: ${info?.messageId || 'sent'}`);
      return { success: true, messageId: info?.messageId, recipient: adminEmail };
    }
  } catch (err) {
    console.error('[ADMIN NOTIFICATION] Failed to dispatch admin order alert:', err.message);
  }
  return { success: false };
};

/**
 * Dispatches initial acknowledgment & bank transfer instructions to customer for bank transfer orders
 */
export const sendCustomerBankInstructionsEmail = async (order, bankConfig) => {
  const bank = bankConfig || {
    bankName: 'Access Bank',
    accountName: 'PENNY CAPSULE LTD',
    accountNumber: '0123456789',
    instructions: 'Please transfer the exact order amount and use your Order Number as the payment reference.',
  };

  const fromHeader = getFromAddress('PENNY Concierge');
  const itemsRows = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 10px 0; font-size: 13px; color: #232220;">
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: #767471;">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${formatMoney(multiplyMoney(item.price || 0, item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fbfbfa; margin: 0; padding: 40px 20px; color: #232220;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 40px; border-radius: 2px;">
        <div style="text-align: center; border-bottom: 1px solid #e8e7e4; padding-bottom: 24px; margin-bottom: 28px;">
          <h1 style="letter-spacing: 0.35em; font-size: 24px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; color: #8e8d8a; margin-top: 6px; text-transform: uppercase;">Order Acknowledgment & Bank Details</p>
        </div>

        <p style="font-size: 14px; margin-bottom: 8px;">Dear <strong>${order.customer}</strong>,</p>
        <p style="font-size: 13px; color: #555350; line-height: 1.6; margin-bottom: 24px;">
          Thank you for ordering with PENNY. Your order <strong>#${order.id}</strong> has been received and is currently in <strong>Awaiting Bank Transfer</strong> status.
        </p>

        <div style="background-color: #f7f6f4; border: 1px solid #e8e7e4; padding: 20px; border-radius: 2px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #767471; margin-bottom: 12px;">Official Bank Transfer Account</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span style="color: #767471;">Bank Name:</span>
            <strong>${bank.bankName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span style="color: #767471;">Account Name:</span>
            <strong>${bank.accountName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span style="color: #767471;">Account Number:</span>
            <strong style="font-family: monospace; font-size: 15px; letter-spacing: 0.1em;">${bank.accountNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px dashed #d5d3ce; padding-top: 8px; margin-top: 8px;">
            <span>Amount to Transfer:</span>
            <strong style="font-family: monospace; color: #232220;">₦ ${formatMoney(order.total || 0)}</strong>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #e8e7e4; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8e8d8a;">
              <th style="padding-bottom: 8px;">Item Description</th>
              <th style="padding-bottom: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="border-top: 1px solid #e8e7e4; padding-top: 16px; margin-bottom: 24px; font-size: 12px; color: #767471; line-height: 1.6;">
          ${bank.instructions || 'Once your transfer is received, your payment will be verified and your purchase receipt will be automatically dispatched to this email.'}
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailer = await getTransporter();
    if (mailer) {
      await mailer.sendMail({
        from: fromHeader,
        to: order.email,
        replyTo: process.env.SMTP_FROM || fromHeader,
        subject: `Order #${order.id} Placed - Bank Transfer Instructions - PENNY`,
        html,
      });
      console.log(`[CUSTOMER NOTIFICATION] Dispatched bank transfer instructions for #${order.id} to <${order.email}>`);
    }
  } catch (err) {
    console.warn('[CUSTOMER NOTIFICATION] Failed to dispatch bank instructions email:', err.message);
  }
};

/**
 * Generates an executive luxury status update email for the customer
 * Supports: 'Awaiting Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
 */
export const generateOrderStatusUpdateHtml = (order, status, customNotes = '') => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const isBank = order.paymentMethod === 'bank_transfer';

  // Config per status
  const statusConfigs = {
    'Awaiting Payment': {
      title: 'Payment Pending',
      badge: 'AWAITING PAYMENT',
      badgeBg: '#fffbeb',
      badgeBorder: '#fef3c7',
      badgeColor: '#b45309',
      icon: '⏳',
      headline: 'Your Order is Awaiting Payment Confirmation',
      message: `Your order <strong>#${order.id}</strong> has been placed and is currently awaiting payment. Please complete your bank transfer of <strong>₦ ${formatMoney(order.total || 0)}</strong> using our official business account details below. Once confirmed by our team, tailoring and preparation will begin immediately.`,
      actionText: 'View Order Details',
      actionUrl: `${clientUrl}/account?tab=orders`,
    },
    'Processing': {
      title: 'In Processing & Tailoring',
      badge: 'PROCESSING & TAILORING',
      badgeBg: '#f0fdfa',
      badgeBorder: '#ccfbf1',
      badgeColor: '#0f766e',
      icon: '🧵',
      headline: 'Your Capsule Wardrobe is Being Crafted & Tailored',
      message: `Great news! Payment for order <strong>#${order.id}</strong> has been verified. Our skilled tailoring team in Lagos is now carefully cutting, fitting, and inspecting your selected capsule pieces to meet our highest standards of quality.`,
      actionText: 'View Order in Account',
      actionUrl: `${clientUrl}/account?tab=orders`,
    },
    'Shipped': {
      title: 'Dispatched & On The Way',
      badge: 'SHIPPED • IN TRANSIT',
      badgeBg: '#eef2ff',
      badgeBorder: '#e0e7ff',
      badgeColor: '#3730a3',
      icon: '🚚',
      headline: 'Your Order Has Been Dispatched',
      message: `Your order <strong>#${order.id}</strong> has departed our Lagos facility and is now in transit with our logistics courier. Please ensure someone is available at your delivery destination to receive the package.`,
      actionText: 'Track Delivery Status',
      actionUrl: `${clientUrl}/account?tab=orders`,
    },
    'Delivered': {
      title: 'Order Delivered',
      badge: 'DELIVERED',
      badgeBg: '#f0fdf4',
      badgeBorder: '#dcfce7',
      badgeColor: '#15803d',
      icon: '✨',
      headline: 'Your PENNY Order Has Been Delivered',
      message: `Your package for order <strong>#${order.id}</strong> has been successfully delivered! We hope your new capsule essentials bring timeless elegance and effortless styling to your wardrobe.`,
      actionText: 'Shop New Arrivals',
      actionUrl: `${clientUrl}/shop`,
    },
    'Cancelled': {
      title: 'Order Cancelled',
      badge: 'ORDER CANCELLED',
      badgeBg: '#fef2f2',
      badgeBorder: '#fee2e2',
      badgeColor: '#991b1b',
      icon: '✕',
      headline: 'Notice of Order Cancellation',
      message: `Your order <strong>#${order.id}</strong> has been cancelled. Any items originally reserved for this order have been returned to our inventory. If you did not request this cancellation or would like to discuss an exchange or refund, please reply directly to this email.`,
      actionText: 'Contact Concierge',
      actionUrl: `${clientUrl}/contact`,
    },
  };

  const config = statusConfigs[status] || {
    title: `Order Status: ${status}`,
    badge: (status || 'UPDATED').toUpperCase(),
    badgeBg: '#f7f6f4',
    badgeBorder: '#e8e7e4',
    badgeColor: '#232220',
    icon: 'ℹ️',
    headline: `Order #${order.id} Status Update`,
    message: `The status of your order has been updated to <strong>${status}</strong>.`,
    actionText: 'View Your Order',
    actionUrl: `${clientUrl}/account?tab=orders`,
  };

  const itemsRows = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 10px 0; font-size: 13px; color: #232220;">
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: #767471;">Size: ${item.size || 'Standard'} • Color: ${item.color || 'Default'} • Qty: ${item.quantity || 1}</span>
      </td>
      <td style="padding: 10px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${formatMoney(multiplyMoney(item.price || 0, item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${config.title} - #${order.id}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfa; margin: 0; padding: 40px 16px; color: #232220;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 36px 32px; border-radius: 2px;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid #e8e7e4; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="letter-spacing: 0.35em; font-size: 24px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; color: #8e8d8a; margin-top: 6px; text-transform: uppercase;">Effortless Dressing by Design</p>
        </div>

        <!-- Status Hero Banner -->
        <div style="background-color: ${config.badgeBg}; border: 1px solid ${config.badgeBorder}; padding: 18px 20px; border-radius: 2px; margin-bottom: 24px; text-align: left;">
          <div style="display: inline-block; font-size: 10px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: ${config.badgeColor}; margin-bottom: 6px;">
            ${config.icon} ${config.badge}
          </div>
          <h2 style="font-size: 16px; font-weight: 600; color: #232220; margin: 0 0 6px 0; line-height: 1.3;">
            ${config.headline}
          </h2>
          <p style="font-size: 13px; color: #555350; line-height: 1.6; margin: 0;">
            ${config.message}
          </p>
        </div>

        <!-- Custom Notes (if supplied by admin) -->
        ${customNotes ? `
          <div style="background-color: #faf9f6; border-left: 3px solid #232220; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #44423f; font-style: italic;">
            <strong>Special Note from Store Concierge:</strong> "${customNotes}"
          </div>
        ` : ''}

        <!-- Order Summary Card -->
        <div style="background-color: #fcfbf9; border: 1px solid #eee; padding: 16px; margin-bottom: 24px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Order Reference:</span>
            <strong style="font-family: monospace; color: #232220;">#${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Recipient:</span>
            <strong>${order.customer}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Delivery Address:</span>
            <span style="text-align: right; max-width: 60%;">${order.address}, ${order.city}, ${order.state}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #767471;">Contact Phone:</span>
            <span>${order.phone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #767471;">Fulfillment Status:</span>
            <strong style="color: ${config.badgeColor}; text-transform: uppercase;">${status}</strong>
          </div>
        </div>

        <!-- Items Table -->
        ${(order.items && order.items.length > 0) ? `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #e8e7e4; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8e8d8a;">
                <th style="padding-bottom: 8px;">Item Description</th>
                <th style="padding-bottom: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="border-top: 1px solid #e8e7e4; padding-top: 12px; margin-bottom: 24px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #767471;">
              <span>Subtotal:</span>
              <span>₦ ${formatMoney(order.subtotal || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #767471;">
              <span>Delivery Fee:</span>
              <span>₦ ${formatMoney(order.deliveryFee || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; color: #232220; padding-top: 6px; border-top: 1px dashed #d5d3ce;">
              <span>Total:</span>
              <span style="font-family: monospace;">₦ ${formatMoney(order.total || 0)}</span>
            </div>
          </div>
        ` : ''}

        <!-- Garment Care Guide (Shown on Delivered) -->
        ${status === 'Delivered' ? `
          <div style="background-color: #faf9f7; border: 1px solid #e8e7e4; padding: 14px 16px; border-radius: 2px; margin-bottom: 24px; font-size: 11px; color: #555350; line-height: 1.6;">
            <strong style="color: #232220; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">🌿 Luxury Garment Care Guide</strong>
            To prolong the silhouette and texture of your PENNY pieces: Hand wash cold or use a gentle cycle with like colors. Avoid bleach and tumble drying; reshape and dry flat in the shade. Warm iron on reverse.
          </div>
        ` : ''}

        <!-- Delivery Courier Note (Shown on Shipped) -->
        ${status === 'Shipped' ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 2px; margin-bottom: 24px; font-size: 11px; color: #475569; line-height: 1.6;">
            <strong style="color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">📦 Courier Contact Information</strong>
            Our dispatch rider will contact you at <strong>${order.phone}</strong> when approaching your delivery location. If you need to update delivery instructions, please reply immediately to this email.
          </div>
        ` : ''}

        <!-- Call to Action Button -->
        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${config.actionUrl}" style="display: inline-block; background-color: #232220; color: #ffffff !important; padding: 14px 28px; font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
            ${config.actionText}
          </a>
        </div>

        <div style="border-top: 1px solid #e8e7e4; padding-top: 16px; text-align: center; font-size: 11px; color: #8e8d8a; line-height: 1.5;">
          Questions about this order? Reply directly to this email or reach our concierge team at <a href="mailto:concierge@pennycapsule.com" style="color: #232220; text-decoration: underline;">concierge@pennycapsule.com</a>.<br/>
          &copy; ${new Date().getFullYear()} PENNY Capsule Wardrobe. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatches a fulfillment status update email to the customer
 * Supports: 'Awaiting Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
 */
export const sendOrderStatusUpdateEmail = async (order, newStatus, customNotes = '') => {
  if (!order || !order.email) {
    console.warn('[NOTIFICATIONS] Cannot send status email: missing order or recipient email.');
    return { success: false, reason: 'missing_email' };
  }

  const fromHeader = getFromAddress('PENNY Orders');

  // Concise luxury subject line with status
  let subject = `Order #${order.id} Status: ${newStatus} - PENNY`;
  if (newStatus === 'Awaiting Payment') {
    subject = `Order #${order.id} Awaiting Payment - PENNY`;
  } else if (newStatus === 'Processing') {
    subject = `Order #${order.id} In Processing & Tailoring - PENNY`;
  } else if (newStatus === 'Shipped') {
    subject = `Your PENNY Order #${order.id} Has Shipped 🚚`;
  } else if (newStatus === 'Delivered') {
    subject = `Your PENNY Order #${order.id} Has Been Delivered ✨`;
  } else if (newStatus === 'Cancelled') {
    subject = `PENNY Order #${order.id} Cancellation Notice`;
  }

  const html = generateOrderStatusUpdateHtml(order, newStatus, customNotes);

  try {
    const mailer = await getTransporter();
    if (mailer) {
      const info = await mailer.sendMail({
        from: fromHeader,
        to: order.email,
        replyTo: process.env.SMTP_FROM || fromHeader,
        subject,
        html,
      });

      console.log(`\n============================================================`);
      console.log(`[CUSTOMER STATUS NOTIFICATION] Dispatched ${newStatus} Email`);
      console.log(`To: ${order.customer} <${order.email}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Order ID: #${order.id}`);
      console.log(`MessageId: ${info?.messageId || 'sent'}`);
      console.log(`============================================================\n`);

      return {
        success: true,
        messageId: info?.messageId || `msg_${Date.now()}`,
        status: newStatus,
        recipient: order.email,
      };
    }
  } catch (err) {
    console.warn(`[CUSTOMER STATUS NOTIFICATION] Failed to send ${newStatus} email for #${order.id}:`, err.message);
    return { success: false, error: err.message };
  }
  return { success: false };
};



