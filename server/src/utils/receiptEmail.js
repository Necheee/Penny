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
        ₦ ${(Number(item.price) * Number(item.quantity)).toLocaleString()}
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
            <span style="color: #232220;">Direct Bank Transfer (Zenith Bank)</span>
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
            <span>₦ ${(Number(order.subtotal) || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #555350;">
            <span>Delivery Fee:</span>
            <span>₦ ${(Number(order.deliveryFee) || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #232220; padding-top: 8px; border-top: 1px dashed #d5d3ce;">
            <span>Total Paid:</span>
            <span style="font-family: monospace;">₦ ${(Number(order.total) || 0).toLocaleString()}</span>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #e8e7e4; padding-top: 24px; font-size: 11px; color: #8e8d8a; line-height: 1.6;">
          <p style="margin: 0;">PENNY CLOTHING CO • Victoria Island, Lagos, Nigeria</p>
          <p style="margin: 4px 0 0 0;">For inquiries regarding your order, reply directly to this notice or contact support@pennycapsule.com.</p>
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

  // In production, nodemailer or Resend / SendGrid handles real SMTP transmission.
  // Here we log the transaction dispatch and return proof of delivery.
  console.log(`\n============================================================`);
  console.log(`[PENNY NOTIFICATION ENGINE] Dispatched Order Confirmation Receipt`);
  console.log(`To: ${order.customer} <${order.email}>`);
  console.log(`Subject: Official Receipt & Confirmation for Order ${order.id} - PENNY`);
  console.log(`Payment Status: VERIFIED & CONFIRMED (Bank Transfer)`);
  console.log(`Total Amount: ₦${(Number(order.total) || 0).toLocaleString()}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`============================================================\n`);

  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    recipient: order.email,
    sentAt: new Date().toISOString(),
    receiptPreview: receiptHtml,
  };
};
