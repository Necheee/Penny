/**
 * Email HTML Template Generators for Admin Preview & Dispatch
 * Matches PENNY brand guidelines: Clean typography, logo, luxury formatting.
 */

export function generateOrderReceiptEmailHtml(order) {
  if (!order) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const orderId = order.id || 'PNY-ORDER';
  const customerName = order.customer || 'Valued Client';
  const customerEmail = order.email || '';
  const paymentStatus = order.paymentConfirmed ? 'Payment Confirmed & Verified' : 'Awaiting Bank Transfer';
  const paymentColor = order.paymentConfirmed ? '#15803d' : '#b45309';
  const addressStr = [order.address, order.city, order.state].filter(Boolean).join(', ') || 'Standard Lagos Delivery';
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total || (subtotal + deliveryFee));

  const itemsRows = items.length > 0 ? items.map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 0; font-size: 13px; color: #232220;">
        <strong>${item.name || 'Penny Capsule Piece'}</strong><br/>
        <span style="font-size: 11px; color: #767471;">Size: ${item.size || '—'} • Color: ${item.color || 'Standard'}${item.color && item.color.includes('(Custom Color)') ? ' <span style="background: #fef3c7; color: #78350f; font-size: 9px; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #fde68a;">Custom Color</span>' : ''} • Qty: ${item.quantity || 1}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('') : `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 0; font-size: 13px; color: #232220;">
        <strong>Order Package</strong><br/>
        <span style="font-size: 11px; color: #767471;">${order.itemsCount || 1} item(s)</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-size: 13px; color: #232220; font-family: monospace;">
        ₦ ${total.toLocaleString()}
      </td>
    </tr>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Receipt - ${orderId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfa; margin: 0; padding: 32px 16px; color: #232220;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 36px 32px; border-radius: 2px;">
    <!-- Brand Header with Logo -->
    <div style="text-align: center; border-bottom: 1px solid #e8e7e4; padding-bottom: 22px; margin-bottom: 26px;">
      <img src="${origin}/logo.png" alt="PENNY" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 8px;" onerror="this.style.display='none'" />
      <h1 style="letter-spacing: 0.35em; font-size: 24px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
      <p style="font-size: 11px; letter-spacing: 0.15em; color: #8e8d8a; margin-top: 6px; text-transform: uppercase;">Official Purchase Receipt & Order Confirmation</p>
    </div>

    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
      <p style="font-size: 14px; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
      <p style="font-size: 13px; color: #555350; line-height: 1.6; margin: 0;">
        Thank you for choosing PENNY. This is your official order confirmation and digital sales receipt for your recent wardrobe investment.
      </p>
    </div>

    <!-- Meta Details Box -->
    <div style="background-color: #f7f6f4; padding: 16px; border-radius: 2px; margin-bottom: 28px; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #767471;">Order Reference:</span>
        <strong style="color: #232220; font-family: monospace;">${orderId}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #767471;">Payment Status:</span>
        <strong style="color: ${paymentColor}; text-transform: uppercase;">${paymentStatus}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #767471;">Payment Method:</span>
        <span style="color: #232220;">${order.paymentMethod === 'bank_transfer' ? 'Direct Bank Transfer' : 'Card / Online Payment'}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #767471;">Delivery Destination:</span>
        <span style="color: #232220;">${addressStr}</span>
      </div>
    </div>

    <!-- Itemized Table -->
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

    <!-- Totals Summary -->
    <div style="border-top: 1px solid #e8e7e4; padding-top: 16px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #555350;">
        <span>Subtotal:</span>
        <span>₦ ${subtotal.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #555350;">
        <span>Standard Delivery:</span>
        <span>${deliveryFee > 0 ? `₦ ${deliveryFee.toLocaleString()}` : 'Free'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #232220; padding-top: 8px; border-top: 1px dashed #d5d3ce;">
        <span>Total Paid:</span>
        <span style="font-family: monospace;">₦ ${total.toLocaleString()}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateInquiryReplyEmailHtml(inquiry, replyText) {
  if (!inquiry) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerName = inquiry.name || 'Valued Client';
  const orderRef = inquiry.orderNumber ? inquiry.orderNumber : null;
  const originalMessage = inquiry.message || '';
  const replyContent = replyText || inquiry.reply || 'No response content.';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Support Response - PENNY</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfa; margin: 0; padding: 32px 16px; color: #232220;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e7e4; padding: 36px 32px; border-radius: 2px;">
    <!-- Header with PENNY Logo -->
    <div style="text-align: center; border-bottom: 2px solid #232220; padding-bottom: 20px; margin-bottom: 24px;">
      <img src="${origin}/logo.png" alt="PENNY" style="height: 38px; width: auto; object-fit: contain; margin-bottom: 8px;" onerror="this.style.display='none'" />
      <h1 style="letter-spacing: 0.3em; font-size: 22px; font-weight: 300; margin: 0; text-transform: uppercase;">PENNY</h1>
      <p style="font-size: 11px; letter-spacing: 0.15em; color: #767471; margin-top: 4px; text-transform: uppercase;">Customer Support Response • Lagos, Nigeria</p>
    </div>

    <!-- Greeting -->
    <p style="font-size: 14px; margin-bottom: 16px;">Dear <strong>${customerName}</strong>,</p>
    <p style="font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 16px;">
      Thank you for contacting PENNY. In response to your inquiry${orderRef ? ` regarding Order <strong>#${orderRef}</strong>` : ''}:
    </p>

    <!-- Admin Response Box -->
    <div style="background: #f7f6f4; border-left: 3px solid #232220; padding: 18px 20px; margin: 18px 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap; color: #232220;">
${replyContent}
    </div>

    <!-- Original Inquiry Excerpt -->
    ${originalMessage ? `
    <div style="background-color: #faf9f7; border: 1px solid #e8e7e4; padding: 12px 14px; border-radius: 2px; font-size: 11px; color: #767471;">
      <strong style="text-transform: uppercase; letter-spacing: 0.1em; color: #232220; display: block; margin-bottom: 4px;">Original Inquiry:</strong>
      <span style="font-style: italic;">"${originalMessage}"</span>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

