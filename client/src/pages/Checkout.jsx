import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const Checkout = () => {
  const { cart, cartTotal, shippingCost } = useCart();
  const [step, setStep] = useState(1);

  const grandTotal = cartTotal + shippingCost;

  if (cart.length === 0) {
    return (
      <div className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-light mb-4">Your bag is empty</h1>
        <Link to="/shop" className="text-[13px] font-medium underline underline-offset-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
      {/* LEFT COL: Forms */}
      <div className="flex-1">
        {/* Step 1: Email */}
        <div className={`mb-8 ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-lg font-medium mb-4">1. Contact Information</h2>
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Email address" 
              className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black"
            />
            {step === 1 && (
              <button 
                onClick={() => setStep(2)}
                className="bg-black text-white px-8 py-3 text-[13px] font-medium"
              >
                Continue to Shipping
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Shipping */}
        <div className={`mb-8 ${step !== 2 && 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-lg font-medium mb-4">2. Shipping Address</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First name" className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black" />
              <input type="text" placeholder="Last name" className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black" />
            </div>
            <input type="text" placeholder="Address" className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black" />
            <input type="text" placeholder="City" className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black" />
            <select className="w-full border border-neutral-300 p-3 text-[13px] focus:outline-none focus:border-black bg-white">
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
            </select>
            {step === 2 && (
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(3)}
                  className="bg-black text-white px-8 py-3 text-[13px] font-medium"
                >
                  Continue to Payment
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="text-[13px] underline underline-offset-4"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Payment */}
        <div className={`mb-8 ${step !== 3 && 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-lg font-medium mb-4">3. Payment</h2>
          <div className="space-y-4">
            <div className="border border-neutral-300 p-4 mb-4">
              <div className="flex items-center gap-3">
                <input type="radio" id="card" name="payment" defaultChecked className="accent-black" />
                <label htmlFor="card" className="text-[13px] font-medium">Paystack (Card, Transfer, USSD)</label>
              </div>
            </div>
            {step === 3 && (
              <div className="flex gap-4">
                <button 
                  className="bg-black text-white px-8 py-3 text-[13px] font-medium w-full md:w-auto"
                >
                  Pay Now
                </button>
                <button 
                  onClick={() => setStep(2)}
                  className="text-[13px] underline underline-offset-4"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COL: Order Summary */}
      <div className="lg:w-96">
        <div className="bg-neutral-50 p-6">
          <h2 className="text-lg font-medium mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                <div className="w-16 h-20 bg-neutral-200 shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-[13px]">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-neutral-500">Size: {item.selectedSize}</p>
                  <p className="text-neutral-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-[13px]">
                  ₦ {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-200 pt-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>₦ {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `₦ ${shippingCost.toLocaleString()}`}</span>
            </div>
            <div className="border-t border-neutral-200 pt-3 flex justify-between font-medium text-base">
              <span>Total</span>
              <span>₦ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
