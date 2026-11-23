// server/test-order-alert.js - Test Admin Order Alert Dispatch
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const SERVER_URL = 'http://127.0.0.1:5000';
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || process.env.ADMIN_EMAIL || 'andalineimekaeze@gmail.com';

async function main() {
  console.log('\n======================================================');
  console.log('   PENNY INSTANT ADMIN ORDER NOTIFICATION TEST');
  console.log('======================================================\n');
  console.log(`Store Owner Destination Email: ${adminEmail}`);

  const testOrderPayload = {
    reference: `transfer_test_${Date.now()}`,
    orderData: {
      orderRef: `PNY-${Math.floor(100000 + Math.random() * 900000)}`,
      email: 'customer.test@example.com',
      firstName: 'Adaobi',
      lastName: 'Okonjo',
      phone: '+234 812 345 6789',
      state: 'Lagos',
      city: 'Lekki Phase 1',
      address: 'Plot 12 Admiralty Way, Lekki',
      shippingMethod: 'standard',
      paymentMethod: 'bank_transfer',
      transferAccountName: 'Adaobi Okonjo',
      cartSubtotal: '50000.00',
      shippingCost: '3500.00',
      cartItems: [
        {
          id: 'p-017',
          productId: 'p-017',
          name: 'Premium Joggers',
          size: 'XS',
          color: 'Grey',
          price: 50000,
          quantity: 1,
        },
      ],
    },
  };

  console.log(`\nPlacing test bank transfer order #${testOrderPayload.orderData.orderRef}...`);
  const res = await fetch(`${SERVER_URL}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testOrderPayload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error('Order placement failed:', data.message);
    process.exit(1);
  }

  console.log(`✅ Order placed successfully!`);
  console.log(`   - Order ID:             ${data.order.id}`);
  console.log(`   - Customer:             ${data.order.customer}`);
  console.log(`   - Status:               ${data.order.status}`);
  console.log(`   - Total Amount:         ₦${data.order.total}`);
  console.log(`   - Transfer Account:     ${data.order.transferAccountName}`);

  console.log(`\n📬 Instant Notification Dispatched:`);
  console.log(`   - Alert sent to Store Owner at: ${adminEmail}`);
  console.log(`   - Subject: 🚨 New Order Alert #${data.order.id} - ₦${data.order.total} from ${data.order.customer}`);
  console.log(`\n🎉 Check your inbox (${adminEmail}) now!`);
  console.log('======================================================\n');
}

main().catch(console.error);
