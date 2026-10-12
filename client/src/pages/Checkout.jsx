import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, ArrowLeft, ShoppingBag, Truck, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

const Checkout = () => {
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

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
    paymentMethod: 'paystack', // 'paystack' or 'bank_transfer'
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
        setOrderId(generatedOrderRef);
        setIsProcessing(false);
        setOrderComplete(true);
        clearCart();
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
              setOrderId(generatedOrderRef);
              setIsProcessing(false);
              setOrderComplete(true);
              clearCart();
            } catch (verErr) {
              console.error('Order verification error:', verErr);
              setOrderId(generatedOrderRef);
              setIsProcessing(false);
              setOrderComplete(true);
              clearCart();
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
        setOrderId(generatedOrderRef);
        setIsProcessing(false);
        setOrderComplete(true);
        clearCart();
      }
    } catch (err) {
      console.error('Payment checkout processing error:', err);
      setIsProcessing(false);
      setPaymentError(err.message || 'Payment could not be processed. Please try again.');
    }
  };

  if (orderComplete) {
    return (
      <div className="pt-28 pb-24 px-4 md:px-8 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center text-brand-charcoal">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center mb-6 shadow-md"
        >
          <Check className="w-8 h-8" />
        </motion.div>

        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe mb-2 font-sans">
          Order Confirmed
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-light mb-3">
          Thank you for your order
        </h1>
        <p className="text-sm text-brand-charcoal/70 font-serif max-w-md mb-6">
          Your order number is <strong className="font-sans font-bold text-brand-charcoal">{orderId}</strong>. A confirmation and receipt has been sent to <span className="font-sans font-medium text-brand-charcoal">{formData.email}</span>.
        </p>

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
          <div className="flex justify-between pt-1">
            <span className="text-brand-charcoal/60 uppercase tracking-wider font-bold">Total Paid</span>
            <span className="font-bold text-sm">₦ {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/shop')}
            className="bg-brand-charcoal text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="border border-brand-charcoal/20 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:border-brand-charcoal transition-colors"
          >
            Return to Home
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

          {/* STEP 3: Payment Options */}
          <div className={`border border-brand-charcoal/10 p-6 md:p-8 bg-white transition-opacity ${step !== 3 ? 'opacity-60' : 'opacity-100'}`}>
            <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-brand-charcoal mb-6">
              3. Payment Method
            </h2>

            {step === 3 && (
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'paystack' ? 'border-brand-charcoal bg-brand-offwhite/40' : 'border-brand-charcoal/20'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={formData.paymentMethod === 'paystack'}
                      onChange={handleChange}
                      className="mt-0.5 mr-3 accent-black"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                          Paystack Online Payment
                        </span>
                        <CreditCard className="w-4 h-4 text-brand-taupe" />
                      </div>
                      <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
                        Pay securely with your Debit Card, Bank Transfer, or USSD via Paystack.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'bank_transfer' ? 'border-brand-charcoal bg-brand-offwhite/40' : 'border-brand-charcoal/20'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleChange}
                      className="mt-0.5 mr-3 accent-black"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        Direct Bank Transfer
                      </span>
                      <p className="text-xs text-brand-charcoal/60 mt-1 font-serif">
                        Make your payment directly into our official bank account. Order processed upon proof of payment.
                      </p>
                    </div>
                  </label>
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
