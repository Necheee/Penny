/**
 * Diagnostic Verification Script: Order Fulfillment Status Emails
 * Tests automated customer email notifications for all 5 order statuses:
 * - Awaiting Payment
 * - Processing
 * - Shipped
 * - Delivered
 * - Cancelled
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import { sendOrderStatusUpdateEmail, sendCustomerBankInstructionsEmail, getTransporter } from './src/utils/receiptEmail.js';

const mockOrder = {
  id: 'PNY-TEST-7788',
  customer: 'Chinaecherem Imekaeze',
  email: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || 'chinaecheremimekaeze@gmail.com',
  phone: '+234 801 234 5678',
  address: '14 Victoria Island Crescent, Apt 4B',
  city: 'Victoria Island',
  state: 'Lagos',
  shippingMethod: 'standard',
  paymentMethod: 'bank_transfer',
  transferAccountName: 'Chinaecherem Imekaeze',
  subtotal: '29000.00',
  deliveryFee: '3500.00',
  total: '32500.00',
  items: [
    {
      name: 'Structured Linen Trench',
      size: 'M',
      color: 'Oatmeal',
      quantity: 1,
      price: '29000.00',
    },
  ],
};

async function runTest() {
  console.log('\n============================================================');
  console.log('PENNY STATUS EMAIL NOTIFICATION VERIFICATION');
  console.log('Target Email:', mockOrder.email);
  console.log('Sender Account:', process.env.GMAIL_USER || '(None/Fallback)');
  console.log('============================================================\n');

  const statuses = [
    'Awaiting Payment',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  let successCount = 0;

  for (const status of statuses) {
    console.log(`[TEST] Dispatching email for status: "${status}"...`);
    const result = await sendOrderStatusUpdateEmail(mockOrder, status);
    if (result.success) {
      console.log(`✅ [SUCCESS] Status "${status}" email sent! MessageId: ${result.messageId}`);
      successCount++;
    } else {
      console.error(`❌ [FAILURE] Status "${status}" email failed:`, result.error || result.reason);
    }
  }

  console.log('\n------------------------------------------------------------');
  console.log(`Results: ${successCount}/${statuses.length} status emails passed.`);
  console.log('============================================================\n');

  if (successCount === statuses.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
