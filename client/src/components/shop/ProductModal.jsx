import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProductById, getSizes } from '../../services/api';
import { Plus, Minus, X, ShoppingBag, Heart, Check, Sparkles, Send, Loader2, Palette, Lock, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

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

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney, multiplyMoney } from '../../utils/money';
import { useProducts } from '../../context/ProductContext';
import SizeGuideModal from './SizeGuideModal';

export default function ProductModal({ productId, closeModal }) {
  const { products, getProductById: getContextProductById } = useProducts();
  const [currentProductId, setCurrentProductId] = useState(productId);
  const modalContainerRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [globalSizes, setGlobalSizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Sync internal state when parent props change
  useEffect(() => {
    setCurrentProductId(productId);
  }, [productId]);

  const { user } = useAuth();
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Custom Color Request Form State for the PENNY Team
  const [activeCustomColor, setActiveCustomColor] = useState('');
  const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCustomerName, setCustomColorCustomerName] = useState('');
  const [customColorEmail, setCustomColorEmail] = useState('');
  const [customColorPhone, setCustomColorPhone] = useState('');
  const [customColorNotes, setCustomColorNotes] = useState('');
  const [isSendingCustomColor, setIsSendingCustomColor] = useState(false);
  const [customColorSuccess, setCustomColorSuccess] = useState(false);
  const [customColorError, setCustomColorError] = useState('');

  useEffect(() => {
    if (user) {
      setCustomColorCustomerName(prev => prev || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      setCustomColorEmail(prev => prev || user.email || '');
      setCustomColorPhone(prev => prev || user.phone || '');
    }
  }, [user]);

  const handleSendCustomColor = async (e) => {
    e.preventDefault();
    setCustomColorError('');

    if (!user) {
      setCustomColorError('Please sign in to request a bespoke custom color formulation.');
      return;
    }

    if (!customColorName.trim()) {
      setCustomColorError('Please enter the custom color or shade you want.');
      return;
    }
    if (!customColorCustomerName.trim()) {
      setCustomColorError('Please enter your name.');
      return;
    }

    setIsSendingCustomColor(true);

    const trimmedColor = customColorName.trim();
    const formattedCustomColor = `${trimmedColor} (Custom Color)`;

    // Format readable table representation of custom color request
    const tableRows = [
      `| Field | Specification |`,
      `| :--- | :--- |`,
      `| **Product** | ${product.name} (ID: ${product.id}) |`,
      `| **Requested Custom Color** | ${trimmedColor} |`,
      `| **Customer Name** | ${customColorCustomerName.trim()} |`,
      `| **Customer Email** | ${user.email.trim().toLowerCase()} |`,
      `| **Phone / WhatsApp** | ${customColorPhone.trim() || 'N/A'} |`,
      `| **Special Notes / Finish** | ${customColorNotes.trim() || 'None provided'} |`,
      `| **Order Status** | Selected for bag / order placement by customer. |`
    ];
    const formattedTableMsg = tableRows.join('\n');

    const payload = {
      name: customColorCustomerName.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      email: user.email.trim().toLowerCase(),
      userId: user.id || null,
      orderNumber: `COLOR-${product.id}`,
      subject: `Custom Color Request: ${product.name} (${trimmedColor})`,
      type: 'custom_color',
      message: formattedTableMsg,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success || data.inquiry || data.data)) {
        setCustomColorSuccess(true);
        setActiveCustomColor(trimmedColor);
        setSelectedColor(formattedCustomColor);
        try {
          const inq = data.data || data.inquiry;
          if (inq) {
            const localInquiries = JSON.parse(localStorage.getItem('penny_my_inquiries') || '[]');
            localStorage.setItem('penny_my_inquiries', JSON.stringify([inq, ...localInquiries]));
          }
        } catch {}
        window.dispatchEvent(new Event('penny_inquiry_sent'));
      } else {
        setCustomColorError(data.message || 'Could not send request. Please try again.');
      }
    } catch (err) {
      console.warn('Error sending custom color message:', err);
      setCustomColorError('Could not connect to server. Please try again.');
    } finally {
      setIsSendingCustomColor(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const found = getContextProductById ? getContextProductById(currentProductId) : null;
        const fetchedProduct = found || await getProductById(currentProductId);
        const fetchedSizes = await getSizes();
        setProduct(fetchedProduct);
        setGlobalSizes(fetchedSizes);
      } catch (error) {
        console.error("Error fetching product", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentProductId) fetchProduct();
  }, [currentProductId, getContextProductById]);


  const isCareCategory = 
    product?.category === 'care-accessories' || 
    product?.category === 'care' || 
    product?.category?.toLowerCase().includes('care') || 
    product?.category?.toLowerCase().includes('accessories');

  useEffect(() => {
    if (product) {
      const primary = product.primaryImage || '/images/products/linen-set-1.jpg';
      setActiveImage(primary);
      const cols = Array.isArray(product.colors) ? product.colors : [];
      setSelectedColor(cols[0] || '');
      setSelectedSize(isCareCategory ? 'One Size' : '');
      setSizeError(false);
      setQuantity(1);
      setActiveCustomColor('');
      setIsCustomColorOpen(false);
      setCustomColorSuccess(false);
      setCustomColorError('');
    }
  }, [product, isCareCategory]);

  // Compute up to 4 similar items from the active catalogue, prioritizing same category
  const similarProducts = (products || [])
    .filter(p => p && p.id !== (product?.id || currentProductId) && !p.isArchived)
    .sort((a, b) => {
      const aSameCat = a.category === product?.category ? 2 : 0;
      const bSameCat = b.category === product?.category ? 2 : 0;
      const aSameSub = (a.subcategory && a.subcategory === product?.subcategory) ? 1 : 0;
      const bSameSub = (b.subcategory && b.subcategory === product?.subcategory) ? 1 : 0;
      return (bSameCat + bSameSub) - (aSameCat + aSameSub);
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-8 shadow-2xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-charcoal mb-4"></div>
          <p className="text-xs tracking-widest uppercase text-brand-charcoal">Loading</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-8 shadow-2xl flex flex-col items-center justify-center max-w-sm w-full text-center">
          <p className="text-sm font-sans mb-4 text-brand-charcoal">Piece not found.</p>
          <button onClick={closeModal} className="px-4 py-2 border border-brand-charcoal text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100">Close</button>
        </div>
      </div>
    );
  }

  const primaryImg = product.primaryImage || '/images/products/linen-set-1.jpg';
  const galleryImgs = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const allImages = [primaryImg, ...galleryImgs].filter(Boolean);
  const selectedVariant = (product.variants || []).find(
    variant => variant.size === selectedSize && variant.colorName === selectedColor,
  );

  const handleQuantity = (type) => {
    if (type === 'inc') setQuantity(prev => prev + 1);
    if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToBag = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product, selectedSize, selectedColor, quantity, selectedVariant?.id || null);
      setIsAdding(false);
      closeModal();
      openCart();
    }, 600);
  };

  const handleBuyNow = () => {
    if (product.isArchived || !product.inStock) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const colorToUse = activeCustomColor ? `${activeCustomColor} (Custom Color)` : selectedColor;
    addToCart(product, selectedSize, colorToUse, quantity, selectedVariant?.id || null);
    closeModal();
    navigate('/checkout');
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
        ref={modalContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto hide-scrollbar shadow-2xl flex flex-col"
      >
        {/* Close Button */}
        <button 
          onClick={closeModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-brand-charcoal transition-colors rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Primary Product Showcase: Gallery on Left, Details & Checkout on Right */}
        <div className="flex flex-col md:flex-row w-full">
          {/* Left Column: Image Gallery */}
          <div className="w-full md:w-1/2 flex flex-col-reverse sm:flex-row bg-[#f8f8f8]">
          <div className="flex sm:flex-col gap-2 p-4 overflow-x-auto sm:overflow-y-auto hide-scrollbar shrink-0">
            {allImages.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[3/4] w-16 sm:w-20 shrink-0 overflow-hidden bg-brand-beige/20 border transition-all ${activeImage === img ? 'border-brand-charcoal opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img 
                  src={img} 
                  alt={`${product.name} view ${idx + 1}`} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/products/linen-set-1.jpg';
                  }}
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>

          <div className="relative aspect-[4/5] sm:aspect-auto sm:h-full w-full bg-[#f4f4f0] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage}
                src={activeImage || '/images/products/linen-set-1.jpg'} 
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/products/linen-set-1.jpg';
                }}
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
              {product.isArchived ? (
                <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-200 mb-1">
                  Archived Piece
                </span>
              ) : product.subcategory ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-taupe mb-1 block">
                  {product.subcategory}
                </span>
              ) : null}
              <h1 className="text-2xl font-serif text-brand-charcoal mb-2">{product.name}</h1>
              <p className="text-lg font-serif text-brand-charcoal/80">₦ {formatMoney(product.price)}</p>
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
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal flex items-center gap-1.5 flex-wrap">
                Color: <span className="text-brand-taupe">{selectedColor}</span>
                {typeof selectedColor === 'string' && selectedColor.includes('(Custom Color)') && (
                  <span className="ml-1 text-[9px] bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 font-bold uppercase tracking-wider rounded-xs inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Custom Order Selected
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {(Array.isArray(product.colors) ? product.colors : []).map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full shadow-sm transition-transform cursor-pointer ${selectedColor === color ? 'ring-2 ring-offset-2 ring-brand-charcoal scale-110' : 'border border-black/10 hover:scale-110'}`}
                  style={{ backgroundColor: getColorHex(color) }}
                  aria-label={`Select color ${color}`}
                  aria-pressed={selectedColor === color}
                />
              ))}

              {/* Custom Color Swatch Pill when applied */}
              {activeCustomColor && (
                <button
                  type="button"
                  onClick={() => setSelectedColor(`${activeCustomColor} (Custom Color)`)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedColor === `${activeCustomColor} (Custom Color)`
                      ? 'bg-brand-charcoal text-white ring-2 ring-offset-2 ring-brand-charcoal'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  }`}
                  aria-label={`Select custom color ${activeCustomColor}`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {activeCustomColor} (Custom)
                </button>
              )}
            </div>
            <div className="mt-3">
              <AnimatePresence mode="wait">
                {!isCustomColorOpen && !customColorSuccess && (
                  <motion.button
                    key="btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => {
                      setIsCustomColorOpen(true);
                      setCustomColorError('');
                    }}
                    className="text-[10px] font-bold tracking-widest uppercase text-brand-taupe hover:text-brand-charcoal transition-colors underline underline-offset-4 decoration-brand-taupe/30 hover:decoration-brand-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700/70" />
                    {activeCustomColor ? `Change custom color ("${activeCustomColor}")` : 'Request a custom color'}
                  </motion.button>
                )}

                {/* Custom Color Gate / Form */}
                {isCustomColorOpen && !customColorSuccess && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="p-4 bg-[#FAF9F6] border border-brand-charcoal/20 rounded-xs shadow-sm mt-2 text-xs space-y-3"
                  >
                    {!user ? (
                      /* Sign-in gate for custom color */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-2">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-brand-charcoal" />
                            <span className="font-bold uppercase tracking-wider text-brand-charcoal text-[11px]">
                              Client Sign-In Required
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomColorOpen(false);
                              setCustomColorError('');
                            }}
                            className="text-brand-charcoal/40 hover:text-brand-charcoal cursor-pointer p-0.5"
                            aria-label="Close"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-brand-charcoal/70 font-serif leading-relaxed">
                          Custom shade formulation and artisan dyeing is exclusively available to registered clients. Please sign in to submit a custom color request for the PENNY team.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <Link
                            to="/signin?redirect=/shop"
                            onClick={closeModal}
                            className="flex-1 py-2.5 px-3 bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-wider text-center hover:bg-black transition-colors rounded-xs shadow-xs"
                          >
                            Sign In to Request
                          </Link>
                          <Link
                            to="/create-account?redirect=/shop"
                            onClick={closeModal}
                            className="flex-1 py-2.5 px-3 border border-brand-charcoal text-brand-charcoal text-[10px] font-bold uppercase tracking-wider text-center hover:bg-neutral-100 transition-colors rounded-xs"
                          >
                            Create Account
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Authenticated Form */
                      <>
                        <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-2">
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-brand-charcoal" />
                            <span className="font-bold uppercase tracking-wider text-brand-charcoal text-[11px]">
                              PENNY Team • Custom Color Request
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomColorOpen(false);
                              setCustomColorError('');
                            }}
                            className="text-brand-charcoal/40 hover:text-brand-charcoal cursor-pointer p-0.5"
                            aria-label="Close custom color form"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-brand-charcoal/70 font-serif leading-relaxed">
                          Specify your desired custom color or shade below. We will send this specification table to the PENNY team and equip this custom shade on your piece so you can place your order immediately.
                        </p>

                        <form onSubmit={handleSendCustomColor} className="space-y-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                              Desired Color / Shade *
                            </label>
                            <input
                              type="text"
                              required
                              value={customColorName}
                              onChange={(e) => setCustomColorName(e.target.value)}
                              placeholder="e.g. Forest Green, Burnt Orange, Dusty Pink, Cobalt Blue"
                              className="w-full bg-white border border-brand-charcoal/20 px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                                Client Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={customColorCustomerName}
                                onChange={(e) => setCustomColorCustomerName(e.target.value)}
                                placeholder="Full name"
                                className="w-full bg-white border border-brand-charcoal/20 px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1 flex items-center justify-between">
                                <span>Email *</span>
                                <span className="text-[9px] text-emerald-700 font-normal normal-case inline-flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                </span>
                              </label>
                              <input
                                type="email"
                                readOnly
                                value={user?.email || ''}
                                className="w-full bg-neutral-100/70 border border-neutral-200 px-3 py-2 text-xs text-neutral-600 rounded-xs cursor-not-allowed"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                                Phone / WhatsApp (Optional)
                              </label>
                              <input
                                type="tel"
                                value={customColorPhone}
                                onChange={(e) => setCustomColorPhone(e.target.value)}
                                placeholder="e.g. +234 801 234 5678"
                                className="w-full bg-white border border-brand-charcoal/20 px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                                Notes or Preferences (Optional)
                              </label>
                              <input
                                type="text"
                                value={customColorNotes}
                                onChange={(e) => setCustomColorNotes(e.target.value)}
                                placeholder="Specific tone or fabric finish"
                                className="w-full bg-white border border-brand-charcoal/20 px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-xs"
                              />
                            </div>
                          </div>

                          {customColorError && (
                            <p className="text-[11px] text-rose-700 font-medium bg-rose-50 p-2 border border-rose-200 rounded-xs">
                              {customColorError}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isSendingCustomColor}
                            className="w-full py-2.5 bg-brand-charcoal text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isSendingCustomColor ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" /> Apply Custom Color & Notify PENNY Team
                              </>
                            )}
                          </button>
                        </form>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Success Card */}
                {customColorSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="p-4 bg-[#fbf9f5] border border-brand-charcoal/20 rounded-xs relative shadow-xs text-xs space-y-3 mt-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-brand-charcoal text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal">
                            Custom Color Applied & PENNY Team Notified
                          </p>
                          <p className="text-xs text-brand-charcoal/80 font-serif mt-1 leading-relaxed">
                            <strong>"{customColorName}"</strong> is now selected for this piece! A readable specification table has been sent to the store admin and logged in your Account portal.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomColorSuccess(false);
                          setIsCustomColorOpen(false);
                        }}
                        className="text-brand-charcoal/40 hover:text-brand-charcoal text-xs p-1 cursor-pointer transition-colors"
                        aria-label="Dismiss notice"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs text-[11px] text-emerald-950 font-medium flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Ready to order: Select your size below and click "Add to Bag" to complete your purchase in "{customColorName}".</span>
                    </div>

                    <div className="pt-2 border-t border-brand-charcoal/10 flex items-center justify-between">
                      <span className="text-[10px] text-brand-charcoal/50 uppercase tracking-widest font-mono">
                        Ref: COLOR-{product.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomColorSuccess(false);
                          setIsCustomColorOpen(true);
                          setCustomColorName('');
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal underline underline-offset-4 hover:text-black cursor-pointer"
                      >
                        Change Custom Color
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Size Selection */}
          {!isCareCategory ? (
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal">Size</span>
                <button 
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[10px] font-bold tracking-[0.1em] uppercase text-brand-taupe underline underline-offset-4 hover:text-brand-charcoal transition-colors cursor-pointer"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {globalSizes.map(size => {
                  const isAvailable = (product.variants || []).some(
                    variant => variant.size === size && Number(variant.stockQuantity) > 0,
                  );
                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      aria-label={`Select size ${size}`}
                      aria-pressed={selectedSize === size}
                      className={`py-2 text-xs font-bold tracking-wider transition-all border cursor-pointer
                        ${!isAvailable ? 'border-brand-charcoal/10 text-brand-charcoal/20 !cursor-not-allowed line-through' : ''}
                        ${isAvailable && selectedSize !== size ? 'border-brand-charcoal/20 text-brand-charcoal hover:border-brand-charcoal' : ''}
                        ${isAvailable && selectedSize === size ? 'border-brand-charcoal bg-brand-charcoal text-white' : ''}
                      `}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-amber-900 tracking-wide font-sans mt-2 font-medium"
                >
                  Please select a size to proceed.
                </motion.p>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-brand-charcoal">Sizing</span>
              </div>
              <div className="inline-flex items-center px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-xs">
                One Size / Standard
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 font-sans">
                Care & accessory essentials do not require sizing selection.
              </p>
            </div>
          )}

          {/* Action Buttons: Add to Bag & Buy Now */}
          <div className="flex flex-col gap-3 mb-6 mt-auto pt-6 border-t border-brand-charcoal/15">
            <div className="flex gap-3">
              <div className="flex items-center justify-between border border-brand-charcoal/20 w-28 px-3 py-3">
                <button onClick={() => handleQuantity('dec')} aria-label="Decrease quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal cursor-pointer">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold" aria-label="Quantity">{quantity}</span>
                <button onClick={() => handleQuantity('inc')} aria-label="Increase quantity" className="text-brand-charcoal/60 hover:text-brand-charcoal cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={handleAddToBag}
                disabled={isAdding || product.isArchived || !product.inStock}
                className={`flex-grow flex items-center justify-center text-xs font-bold tracking-[0.15em] uppercase transition-colors cursor-pointer py-3
                  ${product.isArchived || !product.inStock
                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                    : isAdding 
                      ? 'bg-brand-charcoal/70 text-white' 
                      : 'border border-brand-charcoal text-brand-charcoal hover:bg-neutral-100'}
                `}
              >
                {product.isArchived ? (
                  'Archived Piece'
                ) : !product.inStock ? (
                  'Sold Out'
                ) : isAdding ? (
                  'Adding...'
                ) : (typeof selectedColor === 'string' && selectedColor.includes('(Custom Color)')) ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                    <span>Add in {activeCustomColor || 'Custom'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Add to Bag
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.isArchived || !product.inStock}
              className={`w-full py-3.5 bg-brand-charcoal text-white hover:bg-black text-xs font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs rounded-xs ${
                product.isArchived || !product.inStock ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" /> Buy Now - ₦{formatMoney(multiplyMoney(product.price, quantity))}
            </button>
          </div>
        </div>
      </div>

      {/* You May Also Like Section (Similar Pieces Recommendation) */}
      {similarProducts.length > 0 && (
        <div className="border-t border-brand-charcoal/10 p-6 md:p-10 bg-white">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-serif text-brand-charcoal tracking-wide">
              You may also like
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-taupe">
              Similar Pieces
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {similarProducts.map((simProduct) => {
              const simImg = simProduct.images?.primary || (typeof simProduct.images === 'string' ? simProduct.images : '/images/products/linen-set-1.jpg');
              return (
                <div
                  key={simProduct.id}
                  onClick={() => {
                    setCurrentProductId(simProduct.id);
                    if (modalContainerRef.current) {
                      modalContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="group flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[3/4] mb-3 bg-[#f4f4f0] overflow-hidden">
                    <img
                      src={simImg}
                      alt={simProduct.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/products/linen-set-1.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 border border-brand-charcoal/0 group-hover:border-brand-charcoal/10 transition-colors duration-500 pointer-events-none" />
                  </div>

                  <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-brand-charcoal mb-0.5 line-clamp-1 truncate" title={simProduct.name}>
                    {simProduct.name}
                  </h3>

                  {simProduct.subcategory && (
                    <p className="text-[9px] text-brand-taupe font-medium uppercase tracking-wider mb-1 line-clamp-1">
                      {simProduct.subcategory}
                    </p>
                  )}

                  <p className="text-xs md:text-sm text-brand-charcoal/80 font-serif">
                    ₦ {formatMoney(simProduct.price)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Guide Modal (only for apparel) */}
      {!isCareCategory && (
        <SizeGuideModal 
          isOpen={isSizeGuideOpen} 
          onClose={() => setIsSizeGuideOpen(false)} 
          initialCategory={product.category}
        />
      )}
    </motion.div>
    </div>
  );
}
