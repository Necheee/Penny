import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useModal } from '../../context/ModalContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Heart, Zap } from 'lucide-react';
import { formatMoney } from '../../utils/money';

// Helper to map color names to simple hex values for the swatches
const getColorHex = (colorName) => {
  const map = {
    'Black': '#1a1a1a', 'White': '#ffffff', 'Cream': '#f5f5dc',
    'Olive': '#556b2f', 'Navy': '#000080', 'Charcoal': '#36454f',
    'Taupe': '#483c32', 'Heather Grey': '#9ea2a2', 'Sand': '#c2b280',
    'Rust': '#b7410e', 'Washed Blue': '#7895b6', 'Chocolate': '#3b2f2f',
    'Sage': '#9dc183', 'Off-White': '#f8f8f2'
  };
  return map[colorName] || '#cccccc'; // fallback gray
};

export default function ProductCard({ product }) {
  const { openModal } = useModal();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const isLiked = isInWishlist(product.id);

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // prevent modal from opening
    toggleWishlist(product);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation(); // prevent modal from opening
    const defaultVariant = (product.variants || []).find(variant => Number(variant.stockQuantity) > 0)
      || (product.variants || [])[0];
    const defaultSize = defaultVariant?.size || product.availableSizes?.[0] || 'M';
    const defaultColor = defaultVariant?.colorName || product.colors?.[0] || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1, defaultVariant?.id || null);
    navigate('/checkout');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openModal(product.id)} 
      className="group flex flex-col cursor-pointer"
    >
      <div className="relative aspect-[4/5] mb-4 bg-[#f4f4f0] overflow-hidden">
        <img 
          src={product.primaryImage || '/images/products/linen-set-1.jpg'}
          alt={product.name} 
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/products/linen-set-1.jpg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
        />
        <button 
          onClick={handleWishlistClick}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 p-2 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm transition-colors z-10"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-black text-black' : 'text-black'}`} />
        </button>
        {/* Optional: A subtle border that appears on hover for framing */}
        <div className="absolute inset-0 border border-brand-charcoal/0 group-hover:border-brand-charcoal/10 transition-colors duration-500 pointer-events-none" />
      </div>
      
      {/* Typography refined: uppercase, tracking-wider for name. Serif for price. */}
      <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-brand-charcoal mb-0.5 line-clamp-1 truncate" title={product.name}>
        {product.name}
      </h3>

      {product.subtype && (
        <p className="text-[10px] text-brand-taupe font-medium uppercase tracking-wider mb-1 line-clamp-1">
          {product.subtype}
        </p>
      )}
      
      <p className="text-sm text-brand-charcoal/70 mb-2 font-serif">
        ₦ {formatMoney(product.price)}
      </p>
      
      {/* Visual Color Swatches & Buy Now Button */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        {product.colors && product.colors.length > 0 ? (
          <div className="flex space-x-1.5 items-center">
            {product.colors.slice(0, 4).map((color, idx) => (
              <div 
                key={idx} 
                title={color}
                className="w-3 h-3 rounded-full shadow-xs border border-black/10 shrink-0" 
                style={{ backgroundColor: getColorHex(color) }} 
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[9px] text-neutral-400 font-mono">+{product.colors.length - 4}</span>
            )}
          </div>
        ) : <div />}

        <button
          type="button"
          onClick={handleBuyNow}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-charcoal text-white hover:bg-black text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors shadow-xs z-10 cursor-pointer"
        >
          <Zap className="w-3 h-3" />
          Buy Now
        </button>
      </div>
    </motion.div>
  );
}
