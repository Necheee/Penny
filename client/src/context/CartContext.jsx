import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fromMinorUnits, toMinorUnits } from '../utils/money';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('penny_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isInitialSyncDone = useRef(false);

  // Sync to Cloud Cart Helper
  const syncCartToCloud = useCallback(async (items) => {
    if (!user?.email) return;
    const token = localStorage.getItem('penny_customer_token');
    if (!token) return;
    try {
      await fetch('/api/auth/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id || null,
          cart: items,
        }),
      });
    } catch (e) {
      console.warn('Cloud cart sync notice:', e.message);
    }
  }, [user?.email, user?.id]);

  // Fetch Cloud Cart from Server
  const fetchCloudCart = useCallback(async () => {
    if (!user?.email) return;
    const token = localStorage.getItem('penny_customer_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/cart?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.cart)) {
          const cloudCart = data.cart;
          if (cloudCart.length > 0) {
            setCartItems(cloudCart);
            localStorage.setItem('penny_cart', JSON.stringify(cloudCart));
          } else {
            setCartItems([]);
            localStorage.setItem('penny_cart', JSON.stringify([]));
          }
          isInitialSyncDone.current = true;
        }
      }
    } catch (err) {
      console.warn('Could not fetch cloud cart:', err.message);
    }
  }, [user?.email, user?.id, syncCartToCloud]);

  // Sync cloud cart on login, email change, or window focus
  useEffect(() => {
    if (user?.email) {
      fetchCloudCart();

      const onFocus = () => {
        fetchCloudCart();
      };
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    } else {
      isInitialSyncDone.current = false;
    }
  }, [user?.email, fetchCloudCart]);

  // Keep cartItems synchronized in localStorage & push updates to cloud
  useEffect(() => {
    try {
      localStorage.setItem('penny_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not persist cart to storage:', e);
    }
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Add item to cart
  const addToCart = (product, size, color, quantity = 1, variantId = null) => {
    const cartId = `${product.id}-${variantId || `${color}-${size}`}`;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      let updated;
      if (existing) {
        updated = prev.map(item => 
          item.cartId === cartId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, {
          cartId,
          productId: product.id,
          variantId,
          name: product.name,
          price: product.price,
          cartId,
          productId: product.id,
          variantId,
          name: product.name,
          price: product.price,
          image: product.images?.primary || product.image || (typeof product.images === 'string' ? product.images : '/images/products/linen-set-1.jpg'),
          size,
          color,
          quantity
        }];
      }
      syncCartToCloud(updated);
      return updated;
    });
  };

  // Remove item
  const removeFromCart = (cartId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.cartId !== cartId);
      syncCartToCloud(updated);
      return updated;
    });
  };

  // Update quantity
  const updateQuantity = (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      );
      syncCartToCloud(updated);
      return updated;
    });
  };

  // Clear cart entirely (across current device & cloud)
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.setItem('penny_cart', JSON.stringify([]));
    } catch {}
    syncCartToCloud([]);
  };

  // Calculations
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    try {
      const subtotalMinorUnits = cartItems.reduce(
        (total, item) => {
          const qty = BigInt(Math.max(1, Math.round(Number(item.quantity) || 1)));
          const priceMinor = toMinorUnits(item.price);
          return total + (priceMinor * qty);
        },
        0n,
      );
      return fromMinorUnits(subtotalMinorUnits);
    } catch (err) {
      console.warn('Error computing cart subtotal:', err);
      const fallbackSum = cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );
      return fallbackSum.toFixed(2);
    }
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartSubtotal,
      refreshCart: fetchCloudCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
