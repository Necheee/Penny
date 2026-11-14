import express from 'express';
import nodemailer from 'nodemailer';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';
import { getPool } from '../utils/cloudDb.js';

const router = express.Router();

const defaultInquiries = [
  {
    id: 'INQ-104921',
    name: 'Adaobi Okonjo',
    email: 'adaobi.okonjo@gmail.com',
    orderNumber: 'PNY-892140',
    message: 'Good morning, please can I confirm if my order will be delivered to Lekki Phase 1 before Friday?',
    status: 'read',
    reply: 'Hello Adaobi, yes! Your order is currently processing and scheduled for Thursday morning dispatch.',
    repliedAt: '2026-10-13T14:30:00.000Z',
    createdAt: '2026-10-13T10:15:00.000Z',
  }
];

let inquiriesStore = readJsonFile('inquiries.json', defaultInquiries) || defaultInquiries;

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. Production / Custom SMTP (Resend, SendGrid, Amazon SES, Mailgun)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // 2. Direct Gmail with App Password
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    return transporter;
  }

  // 3. Fallback: Ethereal test account
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
    console.warn('Could not initialize Ethereal contact mailer:', err.message);
    return null;
  }
}

/**
 * GET /api/contact/messages
 * Retrieves all customer inquiries/messages for the Admin Dashboard
 */
router.get('/messages', async (req, res) => {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          order_number VARCHAR(100),
          subject VARCHAR(255) DEFAULT 'General Inquiry',
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'inquiry',
          status VARCHAR(50) DEFAULT 'unread',
          reply TEXT,
          replied_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'General Inquiry';
        ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'inquiry';
      `);
      const dbRes = await pool.query('SELECT * FROM contact_inquiries ORDER BY created_at DESC');
      if (dbRes.rows && dbRes.rows.length > 0) {
        const mapped = dbRes.rows.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          orderNumber: r.order_number,
          subject: r.subject || (r.type === 'custom_color' ? 'Custom Color Request' : 'General Inquiry'),
          message: r.message,
          type: r.type || 'inquiry',
          status: r.status,
          reply: r.reply,
          repliedAt: r.replied_at,
          createdAt: r.created_at,
        }));
        inquiriesStore = mapped;
        writeJsonFile('inquiries.json', inquiriesStore);
        return res.status(200).json({ success: true, count: mapped.length, data: mapped });
      }
    }
  } catch (e) {
    console.warn('[CONTACT INQUIRY] DB query warning, falling back to local storage:', e.message);
  }

  return res.status(200).json({
    success: true,
    count: inquiriesStore.length,
    data: inquiriesStore,
  });
});

/**
 * PATCH /api/contact/messages/:id/read
 * Marks a message as read in storage and database
 */
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const item = inquiriesStore.find(i => i.id === id);
    if (item) {
      item.status = 'read';
      writeJsonFile('inquiries.json', inquiriesStore);
    }

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query("UPDATE contact_inquiries SET status = 'read' WHERE id = $1", [id]);
      }
    } catch (e) {}

    return res.status(200).json({ success: true, message: 'Inquiry marked as read.', data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update message status.' });
  }
});

/**
 * POST /api/contact/messages/:id/reply
 * Dispatches an email response directly to the customer and records the reply
 */
router.post('/messages/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text cannot be empty.' });
    }

    const item = inquiriesStore.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    const repliedAt = new Date().toISOString();
    item.reply = replyText.trim();
    item.repliedAt = repliedAt;
    item.status = 'replied';
    writeJsonFile('inquiries.json', inquiriesStore);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query("UPDATE contact_inquiries SET reply = $1, replied_at = $2, status = 'replied' WHERE id = $3", [item.reply, repliedAt, id]);
      }
    } catch (e) {}

    // Dispatch email to customer
    try {
      const mailer = await getTransporter();
      if (mailer) {
        const info = await mailer.sendMail({
          from: `"PENNY" <${process.env.SMTP_FROM || 'support@penny.com'}>`,
          to: item.email,
          subject: `Response to your PENNY inquiry ${item.orderNumber ? `[Order #${item.orderNumber}]` : ''}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 28px; color: #232220; background: #ffffff; border: 1px solid #e8e7e4;">
              <div style="text-align: center; border-bottom: 2px solid #232220; padding-bottom: 20px; margin-bottom: 24px;">
                <img src="${process.env.CLIENT_URL || 'http://localhost:5173'}/logo.png" alt="PENNY" style="height: 38px; width: auto; object-fit: contain; margin-bottom: 8px;" />
                <h1 style="letter-spacing: 0.3em; font-size: 22px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
                <p style="font-size: 11px; letter-spacing: 0.15em; color: #767471; margin-top: 4px; text-transform: uppercase;">Customer Support Response • Lagos, Nigeria</p>
              </div>
              <p style="font-size: 14px; margin-bottom: 16px;">Dear <strong>${item.name}</strong>,</p>
              <p style="font-size: 13px; color: #555; line-height: 1.6;">Thank you for contacting PENNY. In response to your inquiry${item.orderNumber ? ` regarding Order <strong>#${item.orderNumber}</strong>` : ''}:</p>
              <div style="background: #f7f6f4; border-left: 3px solid #232220; padding: 16px; margin: 18px 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #232220;">
${replyText.trim()}
              </div>
              <div style="background-color: #faf9f7; border: 1px solid #e8e7e4; padding: 12px 14px; border-radius: 2px; font-size: 11px; color: #767471;">
                <strong style="text-transform: uppercase; letter-spacing: 0.1em; color: #232220; display: block; margin-bottom: 4px;">Original Inquiry:</strong>
                <span style="font-style: italic;">"${item.message}"</span>
              </div>
            </div>
          `
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          item.previewUrl = previewUrl;
          writeJsonFile('inquiries.json', inquiriesStore);
          console.log(`[REPLY EMAIL SENT] Ethereal live preview URL: ${previewUrl}`);
        }
      }
    } catch (emailErr) {
      console.warn('[REPLY EMAIL] Notification note:', emailErr.message);
    }

    return res.status(200).json({ success: true, message: 'Reply recorded and email dispatched to customer.', data: item });
  } catch (err) {
    console.error('Error replying to inquiry:', err);
    return res.status(500).json({ success: false, message: 'Failed to process inquiry reply.' });
  }
});

/**
 * GET /api/contact/my-inquiries
 * Retrieves inquiries submitted by a specific user email
 */
router.get('/my-inquiries', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check PostgreSQL first
    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        const dbRes = await pool.query(
          'SELECT * FROM contact_inquiries WHERE LOWER(email) = $1 ORDER BY created_at DESC',
          [cleanEmail]
        );
        if (dbRes.rows && dbRes.rows.length > 0) {
          const mapped = dbRes.rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            orderNumber: r.order_number,
            subject: r.subject || (r.type === 'custom_color' ? 'Custom Color Request' : 'Customer Inquiry'),
            message: r.message,
            type: r.type || 'inquiry',
            status: r.status,
            reply: r.reply,
            repliedAt: r.replied_at,
            createdAt: r.created_at,
          }));
          return res.status(200).json({ success: true, count: mapped.length, data: mapped });
        }
      }
    } catch (e) {
      console.warn('[MY INQUIRIES] DB query warning, falling back to local storage:', e.message);
    }

    const matched = inquiriesStore
      .filter(i => (i.email || '').trim().toLowerCase() === cleanEmail)
      .map(i => ({
        ...i,
        subject: i.subject || (i.type === 'custom_color' ? 'Custom Color Request' : 'Customer Inquiry'),
        type: i.type || 'inquiry',
      }));
    return res.status(200).json({ success: true, count: matched.length, data: matched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inquiries.' });
  }
});

/**
 * POST /api/contact
 * Handles contact form submissions and stores the inquiry
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, orderNumber, message, subject, type } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOrder = (orderNumber || '').trim();
    const cleanMessage = message.trim();
    const finalType = type || (cleanOrder.startsWith('CUSTOM-COLOR') ? 'custom_color' : 'inquiry');
    const finalSubject = (subject || '').trim() || (finalType === 'custom_color' ? 'Custom Color Request' : 'Customer Inquiry');

    const adminEmail = process.env.ADMIN_EMAIL || 'owner@penny.com';
    const senderFrom = process.env.SMTP_FROM || 'support@penny.com';

    // 1. Create and store persistent inquiry record
    const newInquiry = {
      id: `INQ-${Date.now().toString().slice(-6)}`,
      name: cleanName,
      email: cleanEmail,
      orderNumber: cleanOrder,
      subject: finalSubject,
      message: cleanMessage,
      type: finalType,
      status: 'unread',
      reply: null,
      repliedAt: null,
      createdAt: new Date().toISOString(),
    };

    inquiriesStore.unshift(newInquiry);
    writeJsonFile('inquiries.json', inquiriesStore);

    // 2. Persist to Neon Cloud PostgreSQL
    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(`
          INSERT INTO contact_inquiries (id, name, email, order_number, subject, message, type, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            subject = EXCLUDED.subject,
            type = EXCLUDED.type,
            message = EXCLUDED.message;
        `, [
          newInquiry.id,
          newInquiry.name,
          newInquiry.email,
          newInquiry.orderNumber,
          newInquiry.subject,
          newInquiry.message,
          newInquiry.type,
          newInquiry.status,
          newInquiry.createdAt
        ]);
      }
    } catch (dbErr) {
      console.warn('[CONTACT INQUIRY] DB insert warning, stored in local cache:', dbErr.message);
    }

    function formatMessageForAdminEmail(message, type) {
      if (!message) return '';
      const rawLines = message.split('\n').map(l => l.trim()).filter(Boolean);
      const tableLines = rawLines.filter(l => l.startsWith('|') && l.endsWith('|'));

      if (tableLines.length >= 2) {
        const parsedRows = tableLines.map(line => {
          const parts = line.split('|').map(p => p.trim());
          return parts.slice(1, parts.length - 1);
        });
        const header = parsedRows[0];
        const bodyRows = parsedRows.slice(1).filter(row => !row.every(cell => /^:?-+:?$/.test(cell)));

        return `
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; border: 1px solid #e2e0dc;">
            <thead>
              <tr style="background-color: #f6f5f2; border-bottom: 2px solid #232220;">
                ${header.map(col => `<th style="padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #232220;">${col.replace(/\*\*/g, '')}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${bodyRows.map((row, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#faf9f6'}; border-bottom: 1px solid #eeeeea;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #232220; width: 35%; vertical-align: top; font-size: 12px;">
                    ${(row[0] || '').replace(/\*\*/g, '')}
                  </td>
                  <td style="padding: 10px 14px; color: #333330; vertical-align: top; font-size: 13px;">
                    ${(row[1] || '').replace(/\*\*/g, '')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      if ((type === 'custom_color' || rawLines.some(l => l.toLowerCase().includes('requested custom color'))) && rawLines.filter(l => l.includes(':')).length >= 2) {
        const pairs = rawLines.filter(l => l.includes(':')).map(line => {
          const idx = line.indexOf(':');
          return { key: line.slice(0, idx).trim().replace(/\*\*/g, ''), val: line.slice(idx + 1).trim().replace(/\*\*/g, '') };
        });
        return `
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; border: 1px solid #e2e0dc;">
            <thead>
              <tr style="background-color: #f6f5f2; border-bottom: 2px solid #232220;">
                <th style="padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #232220; width: 35%;">Specification Field</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #232220;">Customer Details</th>
              </tr>
            </thead>
            <tbody>
              ${pairs.map((p, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#faf9f6'}; border-bottom: 1px solid #eeeeea;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #232220; vertical-align: top; font-size: 12px;">${p.key}</td>
                  <td style="padding: 10px 14px; color: #333330; vertical-align: top; font-size: 13px;">${p.val}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      return `
        <div style="padding: 16px; background-color: #ffffff; border-left: 3px solid #232220; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #232220;">
          ${message}
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f4; margin: 0; padding: 32px 16px; color: #232220;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 36px; border-radius: 2px;">
          <div style="border-bottom: 2px solid #232220; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.2em; text-transform: uppercase;">PENNY</h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #767471; text-transform: uppercase; letter-spacing: 0.1em;">${finalType === 'custom_color' ? 'Custom Color Request' : 'New Customer Inquiry'} #${newInquiry.id}</p>
          </div>

          <div style="background-color: #fcfbf9; border: 1px solid #eee; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${cleanName} &lt;<a href="mailto:${cleanEmail}" style="color: #232220;">${cleanEmail}</a>&gt;</p>
            ${cleanOrder ? `<p style="margin: 0 0 8px 0;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-weight: bold;">#${cleanOrder}</span></p>` : ''}
            <p style="margin: 0; color: #767471; font-size: 11px;">Received on: ${new Date().toLocaleString('en-GB')}</p>
          </div>

          <div style="margin-bottom: 28px;">
            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #767471;">${finalType === 'custom_color' ? 'Custom Color Specifications Table:' : 'Customer Message:'}</h4>
            ${formatMessageForAdminEmail(cleanMessage, finalType)}
          </div>

          <div style="border-top: 1px solid #e8e7e4; padding-top: 20px; font-size: 12px; color: #767471; text-align: center;">
            <p style="margin: 0 0 8px 0;">To respond to this customer, simply click <strong>Reply</strong> in your email client, or reply from the Admin Dashboard.</p>
            <p style="margin: 0; font-size: 11px; color: #a19f9c;">PENNY Client Care Notification System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send 200 response immediately so the customer's browser gets instantaneous confirmation
    res.status(200).json({
      success: true,
      message: 'Your inquiry has been received. Our client care team will respond to your email within 24 hours.',
      inquiry: newInquiry,
    });

    // Dispatch notification email in the background without blocking the customer's HTTP response
    (async () => {
      let previewUrl = null;
      try {
        const mailer = await getTransporter();
        if (mailer) {
          const info = await mailer.sendMail({
            from: `"PENNY Customer Care" <${senderFrom}>`,
            to: adminEmail,
            replyTo: `"${cleanName}" <${cleanEmail}>`,
            subject: finalType === 'custom_color'
              ? `[Custom Color Request] ${finalSubject} - from ${cleanName}`
              : `Inquiry from ${cleanName} ${cleanOrder ? `[Order #${cleanOrder}]` : ''} - PENNY`,
            html: htmlContent,
          });
          previewUrl = nodemailer.getTestMessageUrl(info) || null;
        }
      } catch (mailErr) {
        console.warn('[CONTACT EMAIL] Background notification note:', mailErr.message);
      }

      console.log(`\n============================================================`);
      console.log(`[PENNY INQUIRY] Customer Contact Form Submitted (#${newInquiry.id})`);
      console.log(`Sender: ${cleanName} <${cleanEmail}>`);
      console.log(`Order Number: ${cleanOrder || 'None'}`);
      console.log(`Sent To Admin: ${adminEmail}`);
      if (previewUrl) console.log(`Ethereal Live Preview: ${previewUrl}`);
      console.log(`============================================================\n`);
    })();
  } catch (error) {
    console.error('Contact endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing your inquiry.',
    });
  }
});

/**
 * DELETE /api/contact/messages/:id
 * Deletes an inquiry message from storage and database
 */
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    inquiriesStore = inquiriesStore.filter(i => i.id !== id);
    writeJsonFile('inquiries.json', inquiriesStore);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query('DELETE FROM contact_inquiries WHERE id = $1', [id]);
      }
    } catch (e) {
      console.warn('[CONTACT INQUIRY] DB delete warning:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Inquiry #${id} deleted successfully.`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry.',
    });
  }
});

export default router;

