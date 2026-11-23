import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  
  // Storage key scoped strictly to active user id, preventing cross-account contamination
  const storageKey = useMemo(() => {
    return user?.id ? `penny_wishlist_${user.id}` : 'penny_wishlist_guest';
  }, [user?.id]);

  const [wishlist, setWishlist] = useState(() => {
    try {
      const activeKey = user?.id ? `penny_wishlist_${user.id}` : 'penny_wishlist_guest';
      const saved = localStorage.getItem(activeKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync updated wishlist to cloud
  const syncWishlistToCloud = useCallback(async (items) => {
    if (!user?.email) return;
    const token = localStorage.getItem('penny_customer_token');
    if (!token) return;

    try {
      await fetch('/api/auth/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id || null,
          wishlist: items,
        }),
      });
    } catch (e) {
      console.warn('Could not sync wishlist to cloud:', e.message);
    }
  }, [user?.email, user?.id]);

  // Fetch private wishlist from cloud on account change
  const fetchCloudWishlist = useCallback(async () => {
    if (!user?.email) {
      // Switched to guest
      try {
        const guestSaved = localStorage.getItem('penny_wishlist_guest');
        setWishlist(guestSaved ? JSON.parse(guestSaved) : []);
      } catch {
        setWishlist([]);
      }
      return;
    }

    const token = localStorage.getItem('penny_customer_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/auth/wishlist?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
          try {
            localStorage.setItem(storageKey, JSON.stringify(data.wishlist));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch cloud wishlist:', err.message);
    }
  }, [user?.email, user?.id, storageKey]);

  // When user changes, update active storage and fetch their isolated cloud wishlist
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setWishlist(saved ? JSON.parse(saved) : []);
    } catch {
      setWishlist([]);
    }

    fetchCloudWishlist();
  }, [storageKey, fetchCloudWishlist]);

  const addToWishlist = (product) => {
    if (!product || !product.id) return;
    setWishlist(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      const updated = [...prev, product];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      syncWishlistToCloud(updated);
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => {
      const updated = prev.filter(item => item.id !== productId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      syncWishlistToCloud(updated);
      return updated;
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([]));
    } catch {}
    syncWishlistToCloud([]);
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      refreshWishlist: fetchCloudWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
