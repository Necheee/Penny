import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('penny_wishlist');
    if (saved) {
      setWishlist(JSON.parse(saved));
    }
  }, []);

  const addToWishlist = (product) => {
    setWishlist(prev => {
      const updated = [...prev, product];
      localStorage.setItem('penny_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => {
      const updated = prev.filter(item => item.id !== productId);
      localStorage.setItem('penny_wishlist', JSON.stringify(updated));
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

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
