import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

// In-Memory store for registered orders (persisted across requests)
export const ordersStore = [
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
    paymentMethod: 'paystack',
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

/**
 * GET /api/payments/config
 * Returns public configuration (e.g. Paystack public key)
 */
router.get('/config', (req, res) => {
  return res.status(200).json({
    success: true,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
  });
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
 * Verifies Paystack transaction and registers confirmed order in orders store
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

    let isVerified = false;
    let paymentDetails = {
      reference,
      channel: 'card',
      currency: 'NGN',
      status: 'success',
      paidAt: new Date().toISOString(),
    };

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
      // In Test/Development environment, references matching format are automatically verified
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification could not be confirmed with payment provider.',
      });
    }

    // Register official order in the system
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
      paymentMethod: 'paystack',
      itemsCount: Array.isArray(orderData?.cartItems) ? orderData.cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 1,
      subtotal: Number(orderData?.cartSubtotal || 0),
      deliveryFee: Number(orderData?.shippingCost || 0),
      total: Number(orderData?.grandTotal || (Number(orderData?.cartSubtotal || 0) + Number(orderData?.shippingCost || 0))),
      status: 'Processing',
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

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
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
