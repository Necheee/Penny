import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/api';
import { useModal } from '../../context/ModalContext';

export default function SearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { openModal } = useModal();

  // Load products when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getProducts()
        .then(data => {
          setAllProducts(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load products for search", err);
          setIsLoading(false);
        });
      // Focus input automatically
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setFilteredProducts([]);
    }
  }, [isOpen]);

  // Filter products based on search term
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredProducts([]);
      return;
    }

    const results = allProducts.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(term);
      const categoryMatch = product.category?.toLowerCase().includes(term);
      const subcategoryMatch = product.subcategory?.toLowerCase().includes(term);
      const descMatch = product.description?.toLowerCase().includes(term);
      const colorMatch = product.colors?.some(c => c.toLowerCase().includes(term));
      return nameMatch || categoryMatch || subcategoryMatch || descMatch || colorMatch;
    });

    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectProduct = (productId) => {
    onClose();
    openModal(productId);
  };

  const handleViewAllInShop = () => {
    onClose();
    navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const popularSearches = ['Linen', 'T-Shirts', 'Trousers', 'Sets', 'Black', 'Overshirt'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-start bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Search Catalogue"
          className="w-full bg-white shadow-2xl border-b border-brand-charcoal/10"
        >
          {/* Search Bar Input Row */}
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
            <div className="flex items-center justify-between gap-4 border-b-2 border-brand-charcoal pb-3">
              <Search className="w-5 h-5 text-brand-charcoal/60 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product, category, color, or fabric..."
                className="w-full text-base sm:text-xl font-serif text-brand-charcoal placeholder:text-brand-charcoal/30 bg-transparent focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search input"
                  className="p-1 hover:bg-neutral-100 rounded-full text-brand-charcoal/40 hover:text-brand-charcoal transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="text-xs uppercase font-bold tracking-widest text-brand-charcoal/60 hover:text-brand-charcoal px-2 py-1 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Quick Suggestions / Popular Searches */}
            {!searchTerm && (
              <div className="pt-6 pb-2">
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-charcoal/50 block mb-3 font-sans">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-brand-charcoal hover:text-white transition-colors text-brand-charcoal/80 font-sans tracking-wide"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Results Area */}
          {searchTerm && (
            <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 border-b border-brand-charcoal/10 pb-2">
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-charcoal/60">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Result' : 'Results'} found
                </span>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={handleViewAllInShop}
                    className="text-xs text-brand-charcoal font-bold uppercase tracking-wider underline underline-offset-4 flex items-center hover:text-brand-taupe transition-colors"
                  >
                    View in Shop <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="py-12 flex justify-center items-center text-brand-charcoal/60">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm font-serif">Searching catalogue...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-brand-charcoal/60 font-serif">
                  <p className="text-lg mb-2">No pieces found matching &ldquo;{searchTerm}&rdquo;.</p>
                  <p className="text-xs text-brand-charcoal/40 font-sans uppercase tracking-wider">
                    Try checking your spelling or searching for a broader term like &ldquo;Linen&rdquo; or &ldquo;Tops&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="group flex gap-3 p-2 border border-transparent hover:border-brand-charcoal/10 hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      <div className="w-16 h-20 bg-neutral-100 overflow-hidden shrink-0">
                        <img
                          src={product.images?.primary}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-brand-taupe">
                          {product.category}
                        </span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal group-hover:text-black line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-xs font-serif text-brand-charcoal/80 mt-1">
                          ₦ {product.price?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

