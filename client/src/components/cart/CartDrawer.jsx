import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, cartSubtotal } = useCart();
  const navigate = useNavigate();

  const FREE_SHIPPING_THRESHOLD = 75000;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - cartSubtotal;
  const progressPercentage = Math.min((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Your Bag"
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-charcoal/10">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-brand-charcoal">Your Bag</h2>
              <button onClick={closeCart} aria-label="Close cart" className="p-2 hover:bg-brand-beige/30 rounded-full transition-colors">
                <X className="w-5 h-5 text-brand-charcoal" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {cartItems.length > 0 && (
              <div className="bg-brand-beige/20 p-4 border-b border-brand-charcoal/5 text-center">
                <p className="text-xs font-bold tracking-widest uppercase text-brand-charcoal mb-2">
                  {amountToFreeShipping > 0 
                    ? `You are ₦${amountToFreeShipping.toLocaleString()} away from free shipping` 
                    : 'You have unlocked free shipping!'}
                </p>
                <div className="w-full h-1 bg-brand-charcoal/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-charcoal transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-brand-taupe font-serif text-lg">Your bag is currently empty.</p>
                  <button onClick={closeCart} className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal underline underline-offset-4 hover:text-brand-taupe transition-colors">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.cartId} className="flex gap-4">
                    <div className="w-24 aspect-[3/4] bg-[#f8f8f8] shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-bold tracking-wider uppercase text-brand-charcoal leading-tight pr-4">{item.name}</h3>
                          <p className="text-xs text-brand-taupe mt-1">{item.color} / Size {item.size}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} aria-label={`Remove ${item.name} from cart`} className="text-brand-charcoal/40 hover:text-brand-charcoal transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex items-center border border-brand-charcoal/20 px-2 py-1.5">
                          <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} aria-label="Decrease quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal px-1">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center" aria-label="Quantity">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} aria-label="Increase quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal px-1">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-serif text-brand-charcoal">
                          ₦ {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {cartItems.length > 0 && (
              <div className="border-t border-brand-charcoal/10 p-6 bg-white space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold tracking-widest uppercase text-brand-charcoal text-xs">Subtotal</span>
                  <span className="font-serif text-lg text-brand-charcoal">₦ {cartSubtotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-brand-taupe text-center">Shipping & taxes calculated at checkout.</p>
                <button 
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center bg-brand-charcoal text-white py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors"
                >
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
