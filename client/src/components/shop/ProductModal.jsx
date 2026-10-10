import { useState, useEffect } from 'react';
import { products, sizes as globalSizes } from '../../data/mockCatalogue';
import { Plus, Minus, X, ShoppingBag, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getColorHex = (colorName) => {
  const map = {
    'Black': '#1a1a1a', 'White': '#ffffff', 'Cream': '#f5f5dc',
    'Olive': '#556b2f', 'Navy': '#000080', 'Charcoal': '#36454f',
    'Taupe': '#483c32', 'Heather Grey': '#9ea2a2', 'Sand': '#c2b280',
    'Rust': '#b7410e', 'Washed Blue': '#7895b6', 'Chocolate': '#3b2f2f',
    'Sage': '#9dc183', 'Off-White': '#f8f8f2'
  };
  return map[colorName] || '#cccccc';
};

const Accordion = ({ title, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-charcoal/20 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex justify-between items-center w-full text-left uppercase tracking-[0.15em] text-xs font-bold text-brand-charcoal focus:outline-none"
      >
        {title}
        <span className="text-brand-charcoal/50">
          {isOpen ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <div className="pt-4 text-sm text-brand-charcoal/80 font-serif leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductModal({ productId, closeModal }) {
  const product = products.find(p => p.id === productId);
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImage, setActiveImage] = useState(product?.images.primary || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (product && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  if (!product) return null;

  const allImages = [product.images.primary, ...(product.images.gallery || [])];

  const handleQuantity = (type) => {
    if (type === 'inc') setQuantity(prev => prev + 1);
    if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToBag = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product, selectedSize, selectedColor, quantity);
      setIsAdding(false);
      closeModal();
      openCart();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Content Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button 
          onClick={closeModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-brand-charcoal transition-colors rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col-reverse sm:flex-row bg-[#f8f8f8]">
          <div className="flex sm:flex-col gap-2 p-4 overflow-x-auto sm:overflow-y-auto hide-scrollbar shrink-0">
            {allImages.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[3/4] w-16 sm:w-20 shrink-0 overflow-hidden bg-brand-beige/20 border transition-all ${activeImage === img ? 'border-brand-charcoal opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="relative aspect-[4/5] sm:aspect-auto sm:h-full w-full bg-[#f4f4f0] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage}
                src={activeImage} 
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Product Details */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif text-brand-charcoal mb-2">{product.name}</h1>
              <p className="text-lg font-serif text-brand-charcoal/80">₦ {product.price.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => toggleWishlist(product)}
              aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-black text-black' : 'text-black'}`} />
            </button>
          </div>

          <div className="h-px w-full bg-brand-charcoal/10 mb-6" />

          {/* Color Selection */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal">
                Color: <span className="text-brand-taupe ml-1">{selectedColor}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full shadow-sm transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-brand-charcoal scale-110' : 'border border-black/10 hover:scale-110'}`}
                  style={{ backgroundColor: getColorHex(color) }}
                  aria-label={`Select color ${color}`}
                  aria-pressed={selectedColor === color}
                />
              ))}
            </div>
            <button onClick={(e) => { e.preventDefault(); alert("Our bespoke team has been notified. Custom colors take 2-3 weeks to produce."); }} className="mt-3 text-[10px] font-bold tracking-widest uppercase text-brand-taupe hover:text-brand-charcoal transition-colors underline underline-offset-4 decoration-brand-taupe/30 hover:decoration-brand-charcoal">
              Request a custom color
            </button>
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal">Size</span>
              <button className="text-[10px] font-bold tracking-[0.1em] uppercase text-brand-taupe underline underline-offset-4 hover:text-brand-charcoal">
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {globalSizes.map(size => {
                const isAvailable = product.availableSizes.includes(size);
                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(size)}
                    aria-label={`Select size ${size}`}
                    aria-pressed={selectedSize === size}
                    className={`py-2 text-xs font-bold tracking-wider transition-all border
                      ${!isAvailable ? 'border-brand-charcoal/10 text-brand-charcoal/20 cursor-not-allowed line-through' : ''}
                      ${isAvailable && selectedSize !== size ? 'border-brand-charcoal/20 text-brand-charcoal hover:border-brand-charcoal' : ''}
                      ${isAvailable && selectedSize === size ? 'border-brand-charcoal bg-brand-charcoal text-white' : ''}
                    `}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {!selectedSize && <p className="text-xs text-red-500/80 mt-2 italic font-serif">Please select a size.</p>}
          </div>

          {/* Add to Bag */}
          <div className="flex gap-3 mb-8">
            <div className="flex items-center justify-between border border-brand-charcoal/20 w-28 px-3 py-3">
              <button onClick={() => handleQuantity('dec')} aria-label="Decrease quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold" aria-label="Quantity">{quantity}</span>
              <button onClick={() => handleQuantity('inc')} aria-label="Increase quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleAddToBag}
              disabled={isAdding}
              className={`flex-grow flex items-center justify-center bg-brand-charcoal text-white text-xs font-bold tracking-[0.15em] uppercase transition-colors
                ${isAdding ? 'opacity-80' : 'hover:bg-black'}
              `}
            >
              {isAdding ? 'Adding...' : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" /> Add to Bag - ₦{(product.price * quantity).toLocaleString()}
                </>
              )}
            </button>
          </div>

          {/* Accordions */}
          <div className="border-t border-brand-charcoal/20 mt-auto pt-4">
            <Accordion title="Description" content={product.description} defaultOpen={true} />
            <Accordion title="Details & Material" content={product.material} />
            <Accordion title="Fit & Sizing" content={product.fit} />
            <Accordion title="Garment Care" content={product.care} />
            <Accordion title="Shipping & Returns" content={product.shipping} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
