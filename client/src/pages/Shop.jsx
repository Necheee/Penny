import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSubcategory = searchParams.get('subcategory') || 'all';

  const { products, categories } = useProducts();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [sortOption, setSortOption] = useState('featured'); // featured, price-asc, price-desc
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const categoriesList = useMemo(() => {
    return [{ id: 'all', name: 'All Products' }, ...(categories || [])];
  }, [categories]);

  // Current selected category object
  const currentCategory = useMemo(() => {
    if (activeCategory === 'all') return null;
    return categoriesList.find(c => c.id === activeCategory || c.slug === activeCategory);
  }, [activeCategory, categoriesList]);

  // Available subcategories for the active category
  const activeSubcategories = useMemo(() => {
    return currentCategory?.subcategories || [];
  }, [currentCategory]);

  // Sync state with URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const subcategoryFromUrl = searchParams.get('subcategory') || 'all';
    setActiveCategory(categoryFromUrl);
    setActiveSubcategory(subcategoryFromUrl);
  }, [searchParams]);

  // Update URL when category changes
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setActiveSubcategory('all');
    const params = new URLSearchParams(searchParams);
    if (catId === 'all') {
      params.delete('category');
      params.delete('subcategory');
    } else {
      params.set('category', catId);
      params.delete('subcategory');
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileFilterOpen(false);
  };

  // Update URL when subcategory changes
  const handleSubcategoryChange = (subName) => {
    setActiveSubcategory(subName);
    const params = new URLSearchParams(searchParams);
    if (!subName || subName === 'all') {
      params.delete('subcategory');
    } else {
      params.set('subcategory', subName);
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileFilterOpen(false);
  };

  // Filter and Sort Logic
  const searchQuery = searchParams.get('search') || '';

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (activeCategory !== 'all') {
      const matchedCat = categoriesList.find(c => c.id === activeCategory || c.slug === activeCategory);
      result = result.filter(p => 
        p.category === activeCategory || 
        (matchedCat && (p.category === matchedCat.id || p.category === matchedCat.slug))
      );
    }

    // Filter by Subcategory
    if (activeSubcategory && activeSubcategory !== 'all') {
      result = result.filter(p => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase());
    }

    // Filter by Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.colors?.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      result.sort((a, b) => (b.featured === a.featured) ? 0 : b.featured ? 1 : -1);
    }

    return result;
  }, [activeCategory, sortOption, products, searchQuery]);

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
          {searchQuery 
            ? `Search: "${searchQuery}"`
            : activeCategory === 'all' 
              ? 'The Collection' 
              : categoriesList.find(c => c.id === activeCategory || c.slug === activeCategory)?.name || 'The Collection'}
        </h1>
        {searchQuery && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('search');
                setSearchParams(params);
              }}
              className="text-xs uppercase font-bold tracking-widest text-brand-charcoal underline underline-offset-4 hover:text-brand-taupe transition-colors"
            >
              Clear Search Filter
            </button>
          </div>
        )}
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
              <span>Sort: {currentSortLabel}</span>
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
              {categoriesList.map((cat) => {
                const isCatActive = activeCategory === cat.id || (cat.slug && activeCategory === cat.slug);
                const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
                return (
                  <li key={cat.id} className="space-y-2">
                    <button
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`text-sm tracking-wide transition-colors block text-left ${
                        isCatActive
                          ? 'font-bold text-brand-charcoal'
                          : 'text-brand-charcoal/60 hover:text-brand-charcoal'
                      }`}
                    >
                      {cat.name}
                    </button>
                    {isCatActive && subs.length > 0 && (
                      <ul className="pl-3 border-l border-brand-charcoal/20 space-y-2 pt-1">
                        <li>
                          <button
                            onClick={() => handleSubcategoryChange('all')}
                            className={`text-xs tracking-wider uppercase transition-colors block text-left ${
                              activeSubcategory === 'all'
                                ? 'font-bold text-brand-charcoal underline underline-offset-4'
                                : 'text-brand-charcoal/50 hover:text-brand-charcoal'
                            }`}
                          >
                            All {cat.name}
                          </button>
                        </li>
                        {subs.map((sub) => (
                          <li key={sub}>
                            <button
                              onClick={() => handleSubcategoryChange(sub)}
                              className={`text-xs tracking-wider uppercase transition-colors block text-left ${
                                activeSubcategory.toLowerCase() === sub.toLowerCase()
                                  ? 'font-bold text-brand-charcoal underline underline-offset-4'
                                  : 'text-brand-charcoal/50 hover:text-brand-charcoal'
                              }`}
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
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
          {/* Subcategory Pills Bar */}
          {activeSubcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar border-b border-brand-charcoal/10">
              <button
                onClick={() => handleSubcategoryChange('all')}
                className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-full whitespace-nowrap shrink-0 ${
                  activeSubcategory === 'all'
                    ? 'bg-brand-charcoal text-white font-bold shadow-xs'
                    : 'bg-brand-beige/30 text-brand-charcoal/70 hover:bg-brand-beige/60 hover:text-brand-charcoal'
                }`}
              >
                All {currentCategory.name}
              </button>
              {activeSubcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => handleSubcategoryChange(sub)}
                  className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-full whitespace-nowrap shrink-0 ${
                    activeSubcategory.toLowerCase() === sub.toLowerCase()
                      ? 'bg-brand-charcoal text-white font-bold shadow-xs'
                      : 'bg-brand-beige/30 text-brand-charcoal/70 hover:bg-brand-beige/60 hover:text-brand-charcoal'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
          {!products ? (
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
