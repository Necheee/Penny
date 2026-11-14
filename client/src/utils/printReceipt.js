/**
 * Utility to generate and print a clean, luxury receipt for orders.
 * Works seamlessly across both Admin and Customer views without cutting off content or printing background UI.
 */
export function printOrderReceipt(order) {
  if (!order) return;

  const orderId = order.id || 'PNY-RECEIPT';
  const customerName = order.customer || 'Valued Client';
  const customerEmail = order.email || '—';
  const customerPhone = order.phone || '—';
  const deliveryAddress = [order.address, order.city, order.state].filter(Boolean).join(', ') || 'Standard Lagos Delivery';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const paymentMethodLabel = order.paymentMethod === 'bank_transfer' ? 'Direct Bank Transfer' : 'Card / Online Payment';
  const paymentStatus = order.paymentConfirmed ? 'PAID & VERIFIED' : (order.status === 'Awaiting Payment' ? 'AWAITING BANK TRANSFER' : 'CONFIRMED');
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const grandTotal = Number(order.total || (subtotal + deliveryFee));

  const itemsHtml = items.length > 0 ? items.map((item, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px;">
        <strong>${item.name || 'Penny Capsule Piece'}</strong>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">
          ${item.size ? `Size: <strong>${item.size}</strong> &nbsp;` : ''}
          ${item.color ? `Color: <strong>${item.color}</strong>${item.color.includes('(Custom Color)') ? ' <span style="background: #fef3c7; color: #78350f; font-size: 9px; padding: 2px 4px; border-radius: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #fde68a;">Custom</span>' : ''}` : ''}
        </div>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; font-family: monospace;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px;">
        ₦ ${(Number(item.price) || 0).toLocaleString()}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; font-weight: bold;">
        ₦ ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="4" style="padding: 16px; text-align: center; color: #888; font-size: 12px;">
        Order Package (${order.itemsCount || 1} item${(order.itemsCount || 1) === 1 ? '' : 's'})
      </td>
    </tr>
  `;

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Receipt - ${orderId} - PENNY</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          background: #fff;
          margin: 0;
          padding: 24px;
          line-height: 1.5;
        }
        .receipt-container {
          max-width: 680px;
          margin: 0 auto;
          border: 1px solid #e5e5e5;
          padding: 36px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand-title {
          font-size: 26px;
          letter-spacing: 0.25em;
          font-weight: 300;
          margin: 0;
          text-transform: uppercase;
        }
        .brand-subtitle {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #777;
          margin-top: 4px;
        }
        .order-badge {
          text-align: right;
        }
        .order-number {
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          margin: 0;
          letter-spacing: 0.05em;
        }
        .order-date {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
          font-size: 12px;
        }
        .info-card {
          background: #faf9f6;
          padding: 14px 18px;
          border-left: 3px solid #1a1a1a;
        }
        .info-label {
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: bold;
          color: #888;
          margin-bottom: 6px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .table th {
          background: #f5f5f5;
          padding: 10px 12px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border-bottom: 1px solid #ddd;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-box {
          width: 260px;
          font-size: 13px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          color: #555;
        }
        .totals-grand {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-top: 2px solid #1a1a1a;
          font-size: 16px;
          font-weight: bold;
          color: #1a1a1a;
          margin-top: 4px;
        }
        .status-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          border: 1px solid #1a1a1a;
          margin-top: 6px;
        }
        .footer {
          border-top: 1px solid #e5e5e5;
          padding-top: 20px;
          text-align: center;
          font-size: 11px;
          color: #777;
        }
        .no-print-bar {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .btn-print {
          background: #1a1a1a;
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }
        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
          .receipt-container {
            border: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <button class="btn-print" onclick="window.print()">Print Official Receipt / Save PDF</button>
      </div>

      <div class="receipt-container">
        <div class="header">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img 
              src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png" 
              alt="PENNY" 
              style="height: 44px; width: auto; object-fit: contain;" 
              onerror="this.style.display='none'"
            />
            <div>
              <h1 class="brand-title">PENNY</h1>
              <div class="brand-subtitle">Official Sales Receipt • Lagos, Nigeria</div>
            </div>
          </div>
          <div class="order-badge">
            <div class="order-number">${orderId}</div>
            <div class="order-date">Date: ${orderDate}</div>
            <div class="status-pill">${paymentStatus}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Client Details</div>
            <strong>${customerName}</strong><br />
            Email: ${customerEmail}<br />
            Phone: ${customerPhone}
          </div>
          <div class="info-card">
            <div class="info-label">Delivery Destination</div>
            ${deliveryAddress}<br />
            <span style="font-size: 11px; color: #666; margin-top: 4px; display: inline-block;">
              Payment Method: <strong>${paymentMethodLabel}</strong>
            </span>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₦ ${subtotal.toLocaleString()}</span>
            </div>
            <div class="totals-row">
              <span>Standard Delivery:</span>
              <span>${deliveryFee > 0 ? `₦ ${deliveryFee.toLocaleString()}` : 'Complimentary'}</span>
            </div>
            <div class="totals-grand">
              <span>Total Paid:</span>
              <span>₦ ${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Thank you for shopping with PENNY.</p>
          <p style="margin: 0; font-size: 10px;">For questions or order assistance, contact support@penny.com.</p>
        </div>
      </div>

      <script>
        // Trigger print after rendering
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  // Open in a clean printable window
  const printWindow = window.open('', '_blank', 'width=840,height=920');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  } else {
    // If popups are blocked by browser, create a hidden iframe to print directly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHtml);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  }
}

