import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([{ id: 'all', name: 'All Products' }]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState('featured'); // featured, price-asc, price-desc
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(fetchedProducts);
        setCategoriesList([{ id: 'all', name: 'All Products' }, ...fetchedCategories]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    setActiveCategory(categoryFromUrl);
  }, [searchParams]);

  // Update URL when category changes
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catId });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileFilterOpen(false);
  };

  // Filter and Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Sort
    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
      // Simplistic sort assuming newer items have later dates or just by ID roughly
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    // "featured" doesn't strictly sort unless we prioritize featured=true
    else {
      result.sort((a, b) => (b.featured === a.featured) ? 0 : b.featured ? 1 : -1);
    }

    return result;
  }, [activeCategory, sortOption, products]);

  const sortOptions = [
    { id: 'featured', label: 'Featured' },
    { id: 'newest', label: 'New Arrivals' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' }
  ];

  const currentSortLabel = sortOptions.find(o => o.id === sortOption)?.label;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-brand-beige/20 py-12 md:py-20 px-6">
        <h1 className="text-3xl md:text-5xl font-serif text-brand-charcoal text-center tracking-wide">
          {activeCategory === 'all' 
            ? 'The Collection' 
            : categoriesList.find(c => c.id === activeCategory)?.name || 'The Collection'}
        </h1>
      </div>

      {/* Main Shop Container */}
      <div className="flex flex-col md:flex-row max-w-[1400px] mx-auto w-full px-6 py-8 md:py-12 gap-12">
        
        {/* Mobile Filter Toggle & Sort Bar */}
        <div className="md:hidden flex justify-between items-center border-b border-brand-charcoal/10 pb-4">
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center space-x-2 text-sm font-medium tracking-wide uppercase text-brand-charcoal"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center space-x-2 text-sm font-medium tracking-wide uppercase text-brand-charcoal"
            >
              <span>Sort</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {isSortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white border border-brand-charcoal/10 shadow-lg z-30"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortOption(opt.id); setIsSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase transition-colors ${sortOption === opt.id ? 'bg-brand-beige/30 font-bold' : 'hover:bg-brand-beige/10'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Desktop Filters */}
        <div className={`md:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-24">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe mb-6">Categories</h3>
            <ul className="space-y-4 mb-12">
              {categoriesList.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`text-sm tracking-wide transition-colors ${activeCategory === cat.id ? 'font-bold text-brand-charcoal' : 'text-brand-charcoal/60 hover:text-brand-charcoal'}`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop Sort */}
            <div className="hidden md:block">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe mb-6">Sort By</h3>
              <ul className="space-y-4">
                {sortOptions.map((opt) => (
                  <li key={opt.id}>
                    <button
                      onClick={() => setSortOption(opt.id)}
                      className={`text-sm flex items-center space-x-2 tracking-wide transition-colors ${sortOption === opt.id ? 'font-bold text-brand-charcoal' : 'text-brand-charcoal/60 hover:text-brand-charcoal'}`}
                    >
                      {sortOption === opt.id && <Check className="w-4 h-4" />}
                      <span className={sortOption === opt.id ? '' : 'pl-6'}>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-grow">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-charcoal"></div>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="py-20 text-center text-brand-taupe text-lg font-serif">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
