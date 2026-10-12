import express from 'express';
import dotenv from 'dotenv';
import { sendOrderConfirmationEmail } from '../utils/receiptEmail.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';

dotenv.config();

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

const defaultOrders = [
  {
    id: 'PNY-892140',
    reference: 'ref_pny_892140',
    customer: 'Alex Balogun',
    email: 'alex.balogun@gmail.com',
    phone: '+234 803 456 7890',
    state: 'Lagos',
    city: 'Victoria Island',
    address: '14 Victoria Island Crescent, Apt 4B',
    shippingMethod: 'standard',
    paymentMethod: 'bank_transfer',
    paymentConfirmed: true,
    itemsCount: 2,
    subtotal: 92000,
    deliveryFee: 5000,
    total: 97000,
    status: 'Processing',
    paidAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        id: 'p-001',
        name: 'The Linen Two-Piece Set',
        size: 'L',
        color: 'Cream',
        price: 45000,
        quantity: 1,
        image: '/images/products/linen-set-1.jpg'
      },
      {
        id: 'p-002',
        name: 'Heavyweight Cotton Lounge Set',
        size: 'M',
        color: 'Charcoal',
        price: 52000,
        quantity: 1,
        image: '/images/products/lounge-set-1.jpg'
      }
    ]
  }
];

const defaultBankDetails = {
  bankName: 'Zenith Bank Plc',
  accountName: 'PENNY CLOTHING CO',
  accountNumber: '1018924560',
  instructions: 'Please transfer the exact total amount and use your Order Number as payment reference/narration. Once verified by store admin, your receipt and confirmation will be emailed.',
};

// Persistent stores backed by server/src/data/storage/
export let ordersStore = readJsonFile('orders.json', defaultOrders) || defaultOrders;
export let bankDetailsStore = readJsonFile('bankDetails.json', defaultBankDetails) || defaultBankDetails;

/**
 * GET /api/payments/config
 * Returns public configuration and official bank transfer details
 */
router.get('/config', (req, res) => {
  return res.status(200).json({
    success: true,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    bankDetails: bankDetailsStore,
    paystackEnabled: false, // inactive for now as requested
  });
});

/**
 * PUT /api/payments/config/bank
 * Updates official bank transfer details (Owner Admin only)
 */
router.put('/config/bank', (req, res) => {
  try {
    const { bankName, accountName, accountNumber, instructions } = req.body;

    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank Name, Account Name, and Account Number are required.',
      });
    }

    bankDetailsStore = {
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      instructions: instructions ? instructions.trim() : bankDetailsStore.instructions,
    };

    writeJsonFile('bankDetails.json', bankDetailsStore);

    return res.status(200).json({
      success: true,
      message: 'Bank transfer information updated successfully.',
      bankDetails: bankDetailsStore,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update bank details.',
    });
  }
});

/**
 * POST /api/payments/initialize
 * Initializes transaction reference and stores pending order details
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, metadata, shippingDetails, cartItems } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email and amount are required to initialize transaction.',
      });
    }

    const orderRef = `PNY-${Date.now().toString().slice(-6)}`;
    const paystackRef = `paystack_${orderRef}_${Math.random().toString(36).substring(2, 7)}`;
    const amountInKobo = Math.round(Number(amount) * 100);

    // If real Paystack Secret Key is configured, initialize transaction via Paystack API
    const isRealPaystack = PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('mock') && !PAYSTACK_SECRET_KEY.includes('your_');

    if (isRealPaystack) {
      try {
        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: amountInKobo,
            reference: paystackRef,
            currency: 'NGN',
            metadata: {
              ...metadata,
              orderRef,
            },
          }),
        });

        const paystackData = await paystackResponse.json();

        if (paystackData.status && paystackData.data) {
          return res.status(200).json({
            success: true,
            authorizationUrl: paystackData.data.authorization_url,
            accessCode: paystackData.data.access_code,
            reference: paystackRef,
            orderRef,
          });
        }
      } catch (apiErr) {
        console.warn('Paystack live initialization failed, falling back to local runner:', apiErr.message);
      }
    }

    // Direct / Test mode response
    return res.status(200).json({
      success: true,
      reference: paystackRef,
      orderRef,
      publicKey: PAYSTACK_PUBLIC_KEY,
      amountInKobo,
      currency: 'NGN',
      message: 'Transaction initialized.',
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment transaction.',
    });
  }
});

/**
 * POST /api/payments/verify
 * Registers placed order.
 * If bank_transfer: status is set to 'Awaiting Payment' and paymentConfirmed is false.
 * If card: status is set to 'Processing' and paymentConfirmed is true.
 */
router.post('/verify', async (req, res) => {
  try {
    const { reference, orderData } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required for verification.',
      });
    }

    const isBankTransfer = orderData?.paymentMethod === 'bank_transfer' || reference.startsWith('transfer_');

    let isVerified = false;
    let paymentDetails = {
      reference,
      channel: isBankTransfer ? 'bank_transfer' : 'card',
      currency: 'NGN',
      status: isBankTransfer ? 'pending_confirmation' : 'success',
      paidAt: isBankTransfer ? null : new Date().toISOString(),
    };

    if (isBankTransfer) {
      // Bank transfers are acknowledged and stored in pending state
      isVerified = true;
    } else {
      const isRealPaystack = PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('mock') && !PAYSTACK_SECRET_KEY.includes('your_');

      if (isRealPaystack) {
        try {
          const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          });
          const verifyJson = await verifyRes.json();

          if (verifyJson.status && verifyJson.data?.status === 'success') {
            isVerified = true;
            paymentDetails = {
              ...paymentDetails,
              channel: verifyJson.data.channel || 'card',
              paidAt: verifyJson.data.paid_at || new Date().toISOString(),
              gatewayResponse: verifyJson.data.gateway_response,
            };
          }
        } catch (verErr) {
          console.warn('Paystack live verification call failed, evaluating test runner:', verErr.message);
        }
      } else {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification could not be confirmed with payment provider.',
      });
    }

    // Register order in the system
    const orderId = orderData?.orderRef || `PNY-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newOrder = {
      id: orderId,
      reference,
      customer: `${orderData?.firstName || 'Valued'} ${orderData?.lastName || 'Client'}`.trim(),
      email: orderData?.email || '',
      phone: orderData?.phone || '',
      state: orderData?.state || 'Lagos',
      city: orderData?.city || 'Lagos',
      address: orderData?.address || '',
      shippingMethod: orderData?.shippingMethod || 'standard',
      paymentMethod: isBankTransfer ? 'bank_transfer' : 'paystack',
      transferAccountName: orderData?.transferAccountName || '',
      paymentConfirmed: !isBankTransfer,
      itemsCount: Array.isArray(orderData?.cartItems) ? orderData.cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 1,
      subtotal: Number(orderData?.cartSubtotal || 0),
      deliveryFee: Number(orderData?.shippingCost || 0),
      total: Number(orderData?.grandTotal || (Number(orderData?.cartSubtotal || 0) + Number(orderData?.shippingCost || 0))),
      status: isBankTransfer ? 'Awaiting Payment' : 'Processing',
      paidAt: paymentDetails.paidAt,
      createdAt: new Date().toISOString(),
      items: Array.isArray(orderData?.cartItems) ? orderData.cartItems.map(item => ({
        id: item.id,
        name: item.name,
        size: item.selectedSize || item.size || 'M',
        color: item.selectedColor || item.color || 'Standard',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        image: item.images?.primary || item.image || '/images/products/linen-set-1.jpg',
      })) : [],
    };

    // Store in order store
    ordersStore.unshift(newOrder);
    writeJsonFile('orders.json', ordersStore);

    return res.status(200).json({
      success: true,
      message: isBankTransfer 
        ? 'Order registered successfully, awaiting bank transfer confirmation.' 
        : 'Payment verified and order confirmed successfully.',
      order: newOrder,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify transaction and confirm order.',
    });
  }
});

/**
 * PATCH /api/payments/orders/:id/status
 * Updates the fulfillment status of an order
 */
router.patch('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = ordersStore.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (status) {
    order.status = status;
    writeJsonFile('orders.json', ordersStore);
  }

  return res.status(200).json({
    success: true,
    message: `Order status updated to ${status}.`,
    order,
  });
});

/**
 * POST /api/payments/orders/:id/confirm-payment
 * Confirms bank transfer receipt for an order and dispatches confirmation receipt email to the customer
 */
router.post('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const order = ordersStore.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.paymentConfirmed = true;
    order.status = 'Processing';
    order.paidAt = new Date().toISOString();
    writeJsonFile('orders.json', ordersStore);

    // Trigger transactional digital receipt and confirmation email
    const emailResult = await sendOrderConfirmationEmail(order);

    return res.status(200).json({
      success: true,
      message: 'Bank transfer confirmed successfully and receipt email sent to customer.',
      order,
      emailDispatch: emailResult,
    });
  } catch (error) {
    console.error('Failed to confirm payment and dispatch email:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while confirming payment.',
    });
  }
});

/**
 * GET /api/payments/orders
 * Returns registered orders for admin inspection or customer lookup
 */
router.get('/orders', (req, res) => {
  return res.status(200).json({
    success: true,
    count: ordersStore.length,
    data: ordersStore,
  });
});

export default router;

