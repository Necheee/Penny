import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, ArrowLeft, ShoppingBag, Truck, CreditCard, AlertCircle, Loader2, Building2, Copy, Clock, User, Printer, MapPin, Phone, Mail, Edit3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { printOrderReceipt } from '../utils/printReceipt';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

const Checkout = () => {
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Checkout mode: 'member' if user is signed in, or 'guest'
  const [checkoutMode, setCheckoutMode] = useState(user ? 'member' : 'guest');

  // Live Bank Transfer Account Details from Backend
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Zenith Bank Plc',
    accountName: 'PENNY CLOTHING CO',
    accountNumber: '1018924560',
    instructions: 'Please transfer the exact total amount and use your Order Number as payment reference/narration.',
  });
  const [copiedNumber, setCopiedNumber] = useState(false);

  useEffect(() => {
    async function loadBankConfig() {
      try {
        const res = await fetch('/api/payments/config');
        if (res.ok) {
          const data = await res.json();
          if (data.bankDetails) {
            setBankDetails(data.bankDetails);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic bank details, using fallback:', err);
      }
    }
    loadBankConfig();
  }, []);

  // Sync logged in user profile with checkout fields
  useEffect(() => {
    if (user && checkoutMode === 'member') {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        address: defaultAddr?.street || prev.address,
        city: defaultAddr?.city || prev.city,
        state: defaultAddr?.state || prev.state,
      }));
    }
  }, [user, checkoutMode]);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    postalCode: '',
    shippingMethod: 'standard', // 'standard' or 'express'
    paymentMethod: 'bank_transfer', // direct bank transfer active by default
    transferAccountName: '', // Name on the transferring bank account
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Dynamic Shipping Calculation according to Location & Policy
  const isLagos = formData.state === 'Lagos';
  const FREE_SHIPPING_THRESHOLD = 200000;
  const isFreeStandardEligible = cartSubtotal >= FREE_SHIPPING_THRESHOLD;

  let shippingCost = 0;
  if (cartSubtotal > 0) {
    if (isLagos) {
      if (formData.shippingMethod === 'express') {
        shippingCost = 5000; // Lagos Express (Same day)
      } else {
        shippingCost = isFreeStandardEligible ? 0 : 3000; // Lagos Standard
      }
    } else {
      // Outside Lagos: ₦5,000 standard (or Free if over ₦200,000)
      shippingCost = isFreeStandardEligible ? 0 : 5000;
    }
  }

  const grandTotal = cartSubtotal + shippingCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for delivery.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.address.trim()) newErrors.address = 'Street address is required.';
    if (!formData.city.trim()) newErrors.city = 'City is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (validateStep2()) setStep(3);
  };

  const [paymentError, setPaymentError] = useState('');

  // Load Paystack Inline JS script dynamically
  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessing(true);

    const orderPayload = {
      ...formData,
      userId: user?.id || null,
      cartItems,
      cartSubtotal,
      shippingCost,
      grandTotal,
    };

    try {
      // 1. Initialize Transaction with Express Backend
      const initResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          amount: grandTotal,
          shippingDetails: formData,
          cartItems,
        }),
      });

      const initData = await initResponse.json();

      if (!initResponse.ok || !initData.success) {
        throw new Error(initData.message || 'Failed to initialize payment gateway.');
      }

      const generatedOrderRef = initData.orderRef || `PNY-${Date.now().toString().slice(-6)}`;
      const transactionRef = initData.reference;

      // Handle Direct Bank Transfer Option
      if (formData.paymentMethod === 'bank_transfer') {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: `transfer_${generatedOrderRef}`,
            orderData: {
              ...orderPayload,
              orderRef: generatedOrderRef,
              paymentMethod: 'bank_transfer',
            },
          }),
        });

        const verifyData = await verifyRes.json();
        const confirmedOrder = verifyData?.order || {
          id: generatedOrderRef,
          customer: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          paymentMethod: 'bank_transfer',
          paymentConfirmed: false,
          status: 'Awaiting Payment',
          subtotal: cartSubtotal,
          deliveryFee: shippingCost,
          total: grandTotal,
          items: cartItems,
          createdAt: new Date().toISOString()
        };

        setCompletedOrder(confirmedOrder);
        try {
          const existing = JSON.parse(localStorage.getItem('penny_orders') || '[]');
          const filtered = existing.filter(o => o.id !== confirmedOrder.id);
          localStorage.setItem('penny_orders', JSON.stringify([confirmedOrder, ...filtered]));
        } catch {}

        setOrderId(confirmedOrder.id);
        setIsProcessing(false);
        setOrderComplete(true);
        clearCart();
        window.dispatchEvent(new Event('penny_notifications_updated'));
        return;
      }

      // Handle Paystack Payment Option
      const scriptLoaded = await loadPaystackScript();

      if (scriptLoaded && window.PaystackPop && initData.publicKey && !initData.publicKey.includes('mock')) {
        // Trigger Official Paystack Inline Popup
        const handler = window.PaystackPop.setup({
          key: initData.publicKey,
          email: formData.email,
          amount: Math.round(grandTotal * 100), // in kobo
          currency: 'NGN',
          ref: transactionRef,
          metadata: {
            custom_fields: [
              {
                display_name: 'Customer Name',
                variable_name: 'customer_name',
                value: `${formData.firstName} ${formData.lastName}`
              },
              {
                display_name: 'Delivery Address',
                variable_name: 'delivery_address',
                value: `${formData.address}, ${formData.city}, ${formData.state}`
              }
            ]
          },
          callback: async (response) => {
            // Verify Transaction with Backend
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reference: response.reference || transactionRef,
                  orderData: {
                    ...orderPayload,
                    orderRef: generatedOrderRef,
                  },
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData?.order) {
                try {
                  const existing = JSON.parse(localStorage.getItem('penny_orders') || '[]');
                  const filtered = existing.filter(o => o.id !== verifyData.order.id);
                  localStorage.setItem('penny_orders', JSON.stringify([verifyData.order, ...filtered]));
                } catch {}
              }
              setOrderId(generatedOrderRef);
              setIsProcessing(false);
              setOrderComplete(true);
              clearCart();
              window.dispatchEvent(new Event('penny_notifications_updated'));
            } catch (verErr) {
              console.error('Order verification error:', verErr);
              setOrderId(generatedOrderRef);
              setIsProcessing(false);
              setOrderComplete(true);
              clearCart();
              window.dispatchEvent(new Event('penny_notifications_updated'));
            }
          },
          onClose: () => {
            setIsProcessing(false);
            setPaymentError('Payment window was closed before completing the order.');
          }
        });

        handler.openIframe();
      } else {
        // Test / Development Mode (Simulate instant card charge authorization)
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: transactionRef,
            orderData: {
              ...orderPayload,
              orderRef: generatedOrderRef,
            },
          }),
        });

        const verifyData = await verifyRes.json();
        const confirmedOrder = verifyData?.order || {
          id: generatedOrderRef,
          customer: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          paymentMethod: 'paystack',
          paymentConfirmed: true,
          status: 'Processing',
          subtotal: cartSubtotal,
          deliveryFee: shippingCost,
          total: grandTotal,
          items: cartItems,
          createdAt: new Date().toISOString()
        };

        setCompletedOrder(confirmedOrder);
        try {
          const existing = JSON.parse(localStorage.getItem('penny_orders') || '[]');
          const filtered = existing.filter(o => o.id !== confirmedOrder.id);
          localStorage.setItem('penny_orders', JSON.stringify([confirmedOrder, ...filtered]));
        } catch {}

        setOrderId(confirmedOrder.id);
        setIsProcessing(false);
        setOrderComplete(true);
        clearCart();
        window.dispatchEvent(new Event('penny_notifications_updated'));
      }
    } catch (err) {
      console.error('Payment checkout processing error:', err);
      setIsProcessing(false);
      setPaymentError(err.message || 'Payment could not be processed. Please try again.');
    }
  };

  if (orderComplete) {
    const isBankTransfer = formData.paymentMethod === 'bank_transfer';

    return (
      <div className="pt-28 pb-24 px-4 md:px-8 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center text-brand-charcoal">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-16 h-16 ${isBankTransfer ? 'bg-amber-600' : 'bg-neutral-900'} text-white rounded-full flex items-center justify-center mb-6 shadow-md`}
        >
          {isBankTransfer ? <Clock className="w-8 h-8" /> : <Check className="w-8 h-8" />}
        </motion.div>

        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe mb-2 font-sans">
          {isBankTransfer ? 'Order Placed • Awaiting Transfer' : 'Order Confirmed'}
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-light mb-3">
          {isBankTransfer ? 'Your Order Has Been Placed' : 'Thank you for your order'}
        </h1>
        <p className="text-sm text-brand-charcoal/70 font-serif max-w-md mb-6">
          Your order number is <strong className="font-sans font-bold text-brand-charcoal">{orderId}</strong>.
          {isBankTransfer 
            ? ' Please complete your bank transfer using the details below. Once confirmed by the store owner, a digital receipt and dispatch notification will be sent to ' 
            : ' A confirmation and receipt has been sent to '}
          <span className="font-sans font-medium text-brand-charcoal">{formData.email}</span>.
        </p>

        {/* Bank Transfer Instructions Card on Receipt Screen */}
        {isBankTransfer && (
          <div className="w-full mb-6 p-5 bg-amber-50/70 border border-amber-200/80 rounded-xs text-left text-xs space-y-3 font-sans">
            <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider text-[11px]">
              <Building2 className="w-4 h-4 text-amber-800" />
              <span>Complete Payment to Process Your Order</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 border border-amber-200/50 rounded-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Bank</span>
                <p className="font-bold text-brand-charcoal text-xs mt-0.5">{bankDetails.bankName}</p>
              </div>
              <div className="bg-white p-2.5 border border-amber-200/50 rounded-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Account Name</span>
                <p className="font-bold text-brand-charcoal text-xs mt-0.5">{bankDetails.accountName}</p>
              </div>
              <div className="bg-white p-2.5 border border-amber-200/50 rounded-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Account Number</span>
                <p className="font-mono font-bold text-brand-charcoal text-xs mt-0.5">{bankDetails.accountNumber}</p>
              </div>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              * Use order reference <strong>{orderId}</strong> as your payment narration. Once the transfer is received and verified by the admin, your order will transition to <strong>Processing</strong> and your official receipt will be emailed immediately.
            </p>
          </div>
        )}

        <div className="bg-brand-offwhite border border-brand-charcoal/10 p-6 w-full text-left space-y-3 mb-8 text-xs font-sans">
          <div className="flex justify-between border-b border-brand-charcoal/10 pb-2">
            <span className="text-brand-charcoal/60 uppercase tracking-wider">Recipient</span>
            <span className="font-bold">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between border-b border-brand-charcoal/10 pb-2">
            <span className="text-brand-charcoal/60 uppercase tracking-wider">Delivery To</span>
            <span className="font-medium text-right">{formData.address}, {formData.city}</span>
          </div>
          <div className="flex justify-between border-b border-brand-charcoal/10 pb-2">
            <span className="text-brand-charcoal/60 uppercase tracking-wider">Payment Method</span>
            <span className="font-medium">{formData.paymentMethod === 'paystack' ? 'Paystack / Card' : 'Direct Bank Transfer'}</span>
          </div>
          {isBankTransfer && formData.transferAccountName && (
            <div className="flex justify-between border-b border-brand-charcoal/10 pb-2">
              <span className="text-brand-charcoal/60 uppercase tracking-wider">Transfer Account</span>
              <span className="font-medium text-brand-charcoal">{formData.transferAccountName}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-brand-charcoal/10 pb-2">
            <span className="text-brand-charcoal/60 uppercase tracking-wider">Status</span>
            <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-xs ${
              isBankTransfer ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {isBankTransfer ? 'Awaiting Bank Transfer Confirmation' : 'Paid & Confirmed'}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-brand-charcoal/60 uppercase tracking-wider font-bold">Total Amount</span>
            <span className="font-bold text-sm">₦ {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <button
            type="button"
            onClick={() => {
              printOrderReceipt(completedOrder || {
                id: orderId,
                customer: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                paymentMethod: formData.paymentMethod,
                paymentConfirmed: !isBankTransfer,
                status: isBankTransfer ? 'Awaiting Payment' : 'Processing',
                subtotal: cartSubtotal,
                deliveryFee: shippingCost,
                total: grandTotal,
                items: cartItems,
                createdAt: new Date().toISOString()
              });
            }}
            className="flex-1 bg-brand-charcoal text-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Receipt / PDF
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="border border-brand-charcoal text-brand-charcoal px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-neutral-50 transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="border border-brand-charcoal/20 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:border-brand-charcoal transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center text-brand-charcoal">
        <ShoppingBag className="w-12 h-12 text-brand-taupe/40 mb-4" />
        <h1 className="text-3xl font-serif font-light mb-3">Your bag is empty</h1>
        <p className="text-sm font-serif text-brand-charcoal/60 mb-6">Explore our curated capsule pieces to add to your order.</p>
        <Link
          to="/shop"
          className="bg-brand-charcoal text-white px-8 py-3 text-xs font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto text-brand-charcoal font-sans">
      {/* Breadcrumb / Back button */}
      <div className="mb-8">
        <Link to="/shop" className="inline-flex items-center text-xs tracking-wider uppercase text-brand-charcoal/60 hover:text-brand-charcoal transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Collection
        </Link>
      </div>

      {/* Main Two-column Layout */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* LEFT COLUMN: Multi-step checkout form */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Step Indicators */}
          <div className="flex items-center border-b border-brand-charcoal/10 pb-4 text-xs font-bold tracking-widest uppercase">
            <span className={`${step >= 1 ? 'text-brand-charcoal' : 'text-brand-charcoal/30'} flex items-center`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[10px] ${step >= 1 ? 'bg-brand-charcoal text-white' : 'bg-neutral-200'}`}>1</span>
              Contact
            </span>
            <div className="w-8 h-px bg-brand-charcoal/20 mx-3" />
            <span className={`${step >= 2 ? 'text-brand-charcoal' : 'text-brand-charcoal/30'} flex items-center`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[10px] ${step >= 2 ? 'bg-brand-charcoal text-white' : 'bg-neutral-200'}`}>2</span>
              Shipping
            </span>
            <div className="w-8 h-px bg-brand-charcoal/20 mx-3" />
            <span className={`${step >= 3 ? 'text-brand-charcoal' : 'text-brand-charcoal/30'} flex items-center`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[10px] ${step >= 3 ? 'bg-brand-charcoal text-white' : 'bg-neutral-200'}`}>3</span>
              Payment
            </span>
          </div>

          {/* STEP 1: Contact Information */}
          <div className={`border border-brand-charcoal/10 p-6 md:p-8 bg-white transition-opacity ${step !== 1 ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-brand-charcoal">
                1. Contact Information
              </h2>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs uppercase font-bold tracking-wider text-brand-taupe underline underline-offset-4 hover:text-brand-charcoal"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Member Sign-In vs Guest Option Banner */}
            {step === 1 && (
              <div className="mb-6 p-4 bg-brand-offwhite border border-brand-charcoal/15 rounded-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-charcoal text-white flex items-center justify-center text-xs font-bold font-sans">
                      {user.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal">
                        Signed in as {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-brand-charcoal/60 font-serif">
                        {user.email} • Your saved profile and address are active.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-brand-charcoal">
                      Already have an account?
                    </p>
                    <p className="text-[11px] text-brand-charcoal/60 font-serif">
                      Sign in for faster checkout with your saved addresses.
                    </p>
                  </div>
                )}

                <div>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => setCheckoutMode(checkoutMode === 'member' ? 'guest' : 'member')}
                      className="text-xs font-bold uppercase tracking-wider text-brand-charcoal underline underline-offset-4 hover:text-black"
                    >
                      {checkoutMode === 'member' ? 'Switch to Guest' : 'Use Saved Profile'}
                    </button>
                  ) : (
                    <Link
                      to="/account/login?redirect=/checkout"
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-charcoal underline underline-offset-4 hover:text-black"
                    >
                      Sign In to Account
                    </Link>
                  )}
                </div>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep1} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. alex@example.com"
                    className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.email ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                  />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                    Phone Number (for dispatch updates) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +234 801 234 5678"
                    className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.phone ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                  />
                  {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-brand-charcoal text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors"
                  >
                    Continue to Shipping
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-brand-charcoal/70 font-serif">
                <p>{formData.email}</p>
                <p>{formData.phone}</p>
              </div>
            )}
          </div>

          {/* STEP 2: Shipping Address */}
          <div className={`border border-brand-charcoal/10 p-6 md:p-8 bg-white transition-opacity ${step !== 2 ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-brand-charcoal">
                2. Shipping Address
              </h2>
              {step > 2 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs uppercase font-bold tracking-wider text-brand-taupe underline underline-offset-4 hover:text-brand-charcoal"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 2 ? (
              <form onSubmit={handleNextStep2} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.firstName ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                    />
                    {errors.firstName && <p className="text-[11px] text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.lastName ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                    />
                    {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                    Street Address & Apartment *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 14 Victoria Island Crescent, Apt 4B"
                    className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.address ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                  />
                  {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className={`w-full border p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-transparent ${errors.city ? 'border-red-500' : 'border-brand-charcoal/20'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-1.5">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full border border-brand-charcoal/20 p-3 text-xs focus:outline-none focus:border-brand-charcoal bg-white"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st === 'Lagos' ? 'Lagos State' : st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Option Selection Based on Location */}
                <div className="pt-2 border-t border-brand-charcoal/10">
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-brand-charcoal/70 mb-3">
                    Delivery Option ({isLagos ? 'Lagos' : 'Outside Lagos'})
                  </label>
                  
                  <div className="space-y-2">
                    {isLagos ? (
                      <>
                        <label className={`flex justify-between items-center p-3 border cursor-pointer transition-all ${formData.shippingMethod === 'standard' ? 'border-brand-charcoal bg-brand-offwhite' : 'border-brand-charcoal/20'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value="standard"
                              checked={formData.shippingMethod === 'standard'}
                              onChange={handleChange}
                              className="accent-black"
                            />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Lagos Standard Delivery</p>
                              <p className="text-[11px] text-brand-charcoal/60 font-serif">1 - 2 Business Days</p>
                            </div>
                          </div>
                          <span className="text-xs font-serif font-bold">
                            {isFreeStandardEligible ? <span className="text-green-700 uppercase font-sans text-[10px]">Free</span> : '₦ 3,000'}
                          </span>
                        </label>

                        <label className={`flex justify-between items-center p-3 border cursor-pointer transition-all ${formData.shippingMethod === 'express' ? 'border-brand-charcoal bg-brand-offwhite' : 'border-brand-charcoal/20'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value="express"
                              checked={formData.shippingMethod === 'express'}
                              onChange={handleChange}
                              className="accent-black"
                            />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Lagos Express (Same Day)</p>
                              <p className="text-[11px] text-brand-charcoal/60 font-serif">Order before 12 PM</p>
                            </div>
                          </div>
                          <span className="text-xs font-serif font-bold">₦ 5,000</span>
                        </label>
                      </>
                    ) : (
                      <label className="flex justify-between items-center p-3 border border-brand-charcoal bg-brand-offwhite cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="standard"
                            checked={true}
                            readOnly
                            className="accent-black"
                          />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Interstate Nationwide Shipping</p>
                            <p className="text-[11px] text-brand-charcoal/60 font-serif">3 - 5 Business Days</p>
                          </div>
                        </div>
                        <span className="text-xs font-serif font-bold">
                          {isFreeStandardEligible ? <span className="text-green-700 uppercase font-sans text-[10px]">Free</span> : '₦ 5,000'}
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    type="submit"
                    className="bg-brand-charcoal text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors"
                  >
                    Continue to Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs uppercase font-bold tracking-wider text-brand-charcoal/60 hover:text-brand-charcoal self-center"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : step > 2 ? (
              <div className="text-xs text-brand-charcoal/70 font-serif space-y-1">
                <p>{formData.firstName} {formData.lastName}</p>
                <p>{formData.address}, {formData.city}, {formData.state}</p>
                <p className="text-[11px] font-sans uppercase tracking-wider text-brand-charcoal font-medium pt-1">
                  Method: {isLagos && formData.shippingMethod === 'express' ? 'Lagos Express (Same Day)' : isLagos ? 'Lagos Standard (1-2 Days)' : 'Nationwide Delivery (3-5 Days)'} — {shippingCost === 0 ? 'Free' : `₦${shippingCost.toLocaleString()}`}
                </p>
              </div>
            ) : null}
          </div>

          {/* STEP 3: Delivery Confirmation & Payment */}
          <div className={`border border-brand-charcoal/10 p-6 md:p-8 bg-white transition-opacity ${step !== 3 ? 'opacity-60' : 'opacity-100'}`}>
            <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-brand-charcoal mb-6">
              3. Delivery Confirmation & Payment
            </h2>

            {step === 3 && (
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Given Delivery Details Confirmation Card */}
                <div className="bg-[#FAF9F6] border border-brand-charcoal/20 p-5 rounded-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-brand-charcoal" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        Review Delivery Details
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal underline underline-offset-4 hover:text-black flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/50 block">Recipient & Contact</span>
                      <p className="font-bold text-brand-charcoal text-sm">{formData.firstName} {formData.lastName}</p>
                      <p className="text-brand-charcoal/80 font-serif flex items-center gap-1.5 pt-0.5">
                        <Phone className="w-3 h-3 text-brand-charcoal/60" /> {formData.phone}
                      </p>
                      <p className="text-brand-charcoal/60 text-[11px] font-serif flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-brand-charcoal/40" /> {formData.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/50 block">Delivery Address</span>
                      <p className="font-bold text-brand-charcoal flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-brand-charcoal/60 shrink-0 mt-0.5" />
                        <span>{formData.address}</span>
                      </p>
                      <p className="text-brand-charcoal/80 font-serif pl-4.5">
                        {formData.city}, {formData.state} {formData.postalCode ? `(${formData.postalCode})` : ''}
                      </p>
                      <p className="text-[11px] text-brand-charcoal/70 pl-4.5 pt-1 font-sans">
                        <span className="font-bold text-brand-charcoal">Dispatch:</span>{' '}
                        {isLagos && formData.shippingMethod === 'express'
                          ? 'Lagos Express (Same Day Dispatch)'
                          : isLagos
                          ? 'Lagos Standard (1-2 Days)'
                          : 'Nationwide Courier (3-5 Days)'}
                        {' • '}
                        <span className="font-bold text-brand-charcoal">
                          {shippingCost === 0 ? 'FREE' : `₦${shippingCost.toLocaleString()}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {formData.notes && (
                    <div className="pt-2 border-t border-brand-charcoal/10 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/50 block">Special Delivery Notes</span>
                      <p className="text-brand-charcoal/80 font-serif italic mt-0.5">"{formData.notes}"</p>
                    </div>
                  )}

                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/70 rounded-xs text-[11px] text-emerald-900 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Please verify that your delivery and contact details above are accurate before completing your order.</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Direct Bank Transfer (Primary Active Payment Method) */}
                  <label className={`flex items-start p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'bank_transfer' ? 'border-brand-charcoal bg-brand-offwhite/40 ring-1 ring-brand-charcoal' : 'border-brand-charcoal/20'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleChange}
                      className="mt-0.5 mr-3 accent-black"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                          Direct Bank Transfer
                        </span>
                        <span className="text-[10px] bg-neutral-900 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
                        Make your payment directly into our official business bank account. Order is confirmed once payment is verified by the store.
                      </p>
                    </div>
                  </label>

                  {/* Paystack Online Payment (Inactive For Now) */}
                  <div className="flex items-start p-4 border border-dashed border-neutral-300 bg-neutral-50/70 opacity-60 cursor-not-allowed select-none rounded-xs">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      disabled
                      checked={false}
                      className="mt-0.5 mr-3 accent-neutral-400 cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Paystack Online Payment
                          </span>
                          <CreditCard className="w-4 h-4 text-neutral-400" />
                        </div>
                        <span className="text-[9px] bg-neutral-200 text-neutral-600 font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                          Temporarily Inactive
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 font-serif">
                        Card, USSD & QR checkout is temporarily paused. Please use Direct Bank Transfer above.
                      </p>
                    </div>
                  </div>

                  {/* PENNY Official Bank Details Card (Driven dynamically by Admin Settings) */}
                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="p-4 bg-brand-offwhite border border-brand-charcoal/20 rounded-xs space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 border-b border-brand-charcoal/10 pb-2">
                        <Building2 className="w-4 h-4 text-brand-charcoal" />
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                          Official PENNY Account Details
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 border border-brand-charcoal/10 rounded-xs">
                          <p className="text-[10px] text-brand-charcoal/50 uppercase font-bold tracking-wider">Bank Name</p>
                          <p className="font-bold text-brand-charcoal text-sm mt-0.5">{bankDetails.bankName}</p>
                        </div>
                        <div className="bg-white p-3 border border-brand-charcoal/10 rounded-xs">
                          <p className="text-[10px] text-brand-charcoal/50 uppercase font-bold tracking-wider">Account Name</p>
                          <p className="font-bold text-brand-charcoal text-sm mt-0.5">{bankDetails.accountName}</p>
                        </div>
                        <div className="bg-white p-3 border border-brand-charcoal/10 rounded-xs sm:col-span-2 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-brand-charcoal/50 uppercase font-bold tracking-wider">Account Number</p>
                            <p className="font-mono font-bold text-brand-charcoal text-base mt-0.5 tracking-wider">{bankDetails.accountNumber}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(bankDetails.accountNumber);
                              setCopiedNumber(true);
                              setTimeout(() => setCopiedNumber(false), 2500);
                            }}
                            className={`px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer ${
                              copiedNumber 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : 'border-brand-charcoal/20 hover:border-brand-charcoal text-brand-charcoal bg-brand-offwhite'
                            }`}
                          >
                            {copiedNumber ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sender Account Name Input */}
                      <div className="pt-2 border-t border-brand-charcoal/10">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                          Name on Transferring Bank Account *
                        </label>
                        <input
                          type="text"
                          name="transferAccountName"
                          value={formData.transferAccountName}
                          onChange={handleChange}
                          placeholder="e.g. Chinedu Okeke (or Company Account Name)"
                          required={formData.paymentMethod === 'bank_transfer'}
                          className="w-full bg-white border border-brand-charcoal/20 px-3 py-2.5 text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-xs"
                        />
                        <p className="text-[10px] text-brand-charcoal/60 mt-1 font-serif">
                          Helps the business owner identify your transfer if you are paying from a different account name, company account, or partner's account.
                        </p>
                      </div>

                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xs text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Instructions:</strong> Please transfer the exact order total of <strong>₦ {grandTotal.toLocaleString()}</strong>. In your bank app transfer narration/remark, enter your name or order reference. Once confirmed by store admin, your receipt and dispatch email will be sent automatically.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {paymentError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 rounded-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-brand-charcoal/60 bg-neutral-50 p-3 border border-brand-charcoal/10">
                  <ShieldCheck className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span>256-bit encrypted checkout. Your payment details are protected and safe.</span>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`bg-brand-charcoal text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                      isProcessing ? 'opacity-70 cursor-wait' : 'hover:bg-black'
                    }`}
                  >
                    {isProcessing ? 'Authorizing Payment...' : `Complete Order • ₦ ${grandTotal.toLocaleString()}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs uppercase font-bold tracking-wider text-brand-charcoal/60 hover:text-brand-charcoal self-center"
                  >
                    Back to Shipping
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="w-full lg:w-96 shrink-0 sticky top-28">
          <div className="border border-brand-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-charcoal mb-6 border-b border-brand-charcoal/10 pb-3">
              Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h2>

            {/* Item List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1 mb-6">
              {cartItems.map((item) => (
                <div key={item.cartId} className="flex gap-3 text-xs">
                  <div className="w-14 h-18 bg-[#f5f5f5] overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold uppercase tracking-wider text-brand-charcoal truncate">
                      {item.name}
                    </h4>
                    <p className="text-brand-taupe mt-0.5">Size: {item.size} • {item.color}</p>
                    {item.color?.includes('(Custom Color)') && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.5 rounded-xs font-bold uppercase tracking-wider mt-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Custom Color
                      </span>
                    )}
                    <p className="text-brand-charcoal/60 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-serif text-brand-charcoal text-right shrink-0">
                    ₦ {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-brand-charcoal/10 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-brand-charcoal/70">
                <span>Subtotal</span>
                <span className="font-serif text-brand-charcoal">₦ {cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal/70 items-center">
                <span className="flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1" /> Delivery
                </span>
                <span className="font-serif text-brand-charcoal">
                  {shippingCost === 0 ? (
                    <span className="font-sans text-[11px] font-bold text-green-700 tracking-wider uppercase">Free</span>
                  ) : (
                    `₦ ${shippingCost.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="border-t border-brand-charcoal/10 pt-3 flex justify-between font-bold text-sm text-brand-charcoal">
                <span className="uppercase tracking-wider">Total</span>
                <span className="font-serif text-base">₦ {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Free Shipping Tip */}
            {shippingCost > 0 && (
              <p className="text-[11px] text-brand-taupe mt-4 font-serif text-center bg-brand-offwhite p-2 border border-brand-charcoal/5">
                Orders over ₦{FREE_SHIPPING_THRESHOLD.toLocaleString()} qualify for complimentary delivery.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
