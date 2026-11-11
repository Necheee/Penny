import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { SlidersHorizontal, ChevronDown, Check, X, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';

export const MATERIAL_OPTIONS = [
  { id: 'linen', label: 'Linen', match: ['linen'] },
  { id: 'heavyweight-cotton', label: 'Heavyweight Cotton', match: ['heavyweight', 'cotton', 'french terry', 'twill', 'ripstop'] },
  { id: 'denim', label: 'Denim', match: ['denim', 'selvedge', 'jean'] },
  { id: 'corduroy', label: 'Corduroy', match: ['corduroy', 'cord'] },
  { id: 'knitwear', label: 'Knitwear', match: ['knit', 'wool', 'merino', 'cashmere', 'silk'] }
];

export const FIT_OPTIONS = [
  { id: 'body-fit', label: 'Body-fit', match: ['body-fit', 'body', 'slim', 'fitted', 'tailored'] },
  { id: 'relaxed', label: 'Relaxed', match: ['relaxed', 'boxy', 'regular', 'casual', 'classic'] },
  { id: 'oversized', label: 'Oversized', match: ['oversiz', 'oversized', 'drop shoulder'] }
];

export const COLOR_FAMILIES = [
  {
    id: 'core-neutrals',
    label: 'Core Neutrals',
    description: 'Black, White, Cream/Beige, Ash/Grey',
    colors: ['Black', 'White', 'Cream', 'Beige', 'Ash', 'Grey', 'Gray', 'Charcoal', 'Taupe', 'Sand', 'Off-White'],
    swatches: [
      { name: 'Black', hex: '#1C1C1C' },
      { name: 'White', hex: '#FFFFFF', border: true },
      { name: 'Cream / Beige', hex: '#F5F2EB', border: true },
      { name: 'Ash / Grey', hex: '#9E9E9E' },
    ]
  },
  {
    id: 'earth-tones',
    label: 'Earth Tones',
    description: 'Olive, Forest Green, Camel, Coffee Brown',
    colors: ['Olive', 'Forest Green', 'Green', 'Camel', 'Coffee Brown', 'Brown', 'Khaki', 'Tan'],
    swatches: [
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Forest Green', hex: '#1E392A' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Coffee Brown', hex: '#4B3621' },
    ]
  },
  {
    id: 'seasonal-accents',
    label: 'Seasonal Accents',
    description: 'Burgundy, Burnt Orange, Baby Pink, Sky Blue, Striped Sky Blue, Navy',
    colors: ['Burgundy', 'Burnt Orange', 'Baby Pink', 'Pink', 'Sky Blue', 'Striped Sky Blue', 'Blue', 'Navy', 'Indigo'],
    swatches: [
      { name: 'Burgundy', hex: '#6B1D2F' },
      { name: 'Burnt Orange', hex: '#CC5500' },
      { name: 'Baby Pink', hex: '#F4C2C2' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Navy', hex: '#000080' },
    ]
  }
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSubcategory = searchParams.get('subcategory') || 'all';
  const initialSubtype = searchParams.get('subtype') || 'all';
  const initialMaterial = searchParams.get('material') || 'all';
  const initialFit = searchParams.get('fit') || 'all';
  const initialColorFamily = searchParams.get('colorFamily') || 'all';

  const { products, categories } = useProducts();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [activeSubtype, setActiveSubtype] = useState(initialSubtype);
  const [activeMaterial, setActiveMaterial] = useState(initialMaterial);
  const [activeFit, setActiveFit] = useState(initialFit);
  const [activeColorFamily, setActiveColorFamily] = useState(initialColorFamily);

  const [sortOption, setSortOption] = useState('featured'); // featured, price-asc, price-desc, newest
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

  // Available subcategories for the active category (normalized)
  const activeSubcategories = useMemo(() => {
    const raw = currentCategory?.subcategories || [];
    return raw.map(sub => {
      if (typeof sub === 'string') {
        return { name: sub, subtypes: [] };
      }
      return {
        name: sub.name || '',
        subtypes: Array.isArray(sub.subtypes) ? sub.subtypes : []
      };
    });
  }, [currentCategory]);

  // Current active subcategory object
  const currentSubcategoryObj = useMemo(() => {
    if (!activeSubcategory || activeSubcategory === 'all') return null;
    return activeSubcategories.find(s => s.name.toLowerCase() === activeSubcategory.toLowerCase());
  }, [activeSubcategory, activeSubcategories]);

  // Available subtypes under the active subcategory
  const activeSubtypes = useMemo(() => {
    return currentSubcategoryObj?.subtypes || [];
  }, [currentSubcategoryObj]);

  // Sync state with URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const subcategoryFromUrl = searchParams.get('subcategory') || 'all';
    const subtypeFromUrl = searchParams.get('subtype') || 'all';
    const materialFromUrl = searchParams.get('material') || 'all';
    const fitFromUrl = searchParams.get('fit') || 'all';
    const colorFamilyFromUrl = searchParams.get('colorFamily') || 'all';

    setActiveCategory(categoryFromUrl);
    setActiveSubcategory(subcategoryFromUrl);
    setActiveSubtype(subtypeFromUrl);
    setActiveMaterial(materialFromUrl);
    setActiveFit(fitFromUrl);
    setActiveColorFamily(colorFamilyFromUrl);
  }, [searchParams]);

  // Helper to update specific param in URL
  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  // Update URL when category changes
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setActiveSubcategory('all');
    setActiveSubtype('all');
    const params = new URLSearchParams(searchParams);
    if (catId === 'all') {
      params.delete('category');
      params.delete('subcategory');
      params.delete('subtype');
    } else {
      params.set('category', catId);
      params.delete('subcategory');
      params.delete('subtype');
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileFilterOpen(false);
  };

  // Update URL when subcategory changes
  const handleSubcategoryChange = (subName) => {
    const target = (activeSubcategory.toLowerCase() === (subName || '').toLowerCase()) ? 'all' : subName;
    setActiveSubcategory(target);
    setActiveSubtype('all');
    const params = new URLSearchParams(searchParams);
    if (!target || target === 'all') {
      params.delete('subcategory');
      params.delete('subtype');
    } else {
      params.set('subcategory', target);
      params.delete('subtype');
    }
    setSearchParams(params);
    setIsMobileFilterOpen(false);
  };

  // Update URL when subtype changes
  const handleSubtypeChange = (subtypeName) => {
    const target = (activeSubtype.toLowerCase() === (subtypeName || '').toLowerCase()) ? 'all' : subtypeName;
    setActiveSubtype(target);
    updateParam('subtype', target);
    setIsMobileFilterOpen(false);
  };

  // Toggle Material filter
  const handleMaterialChange = (matId) => {
    const target = activeMaterial === matId ? 'all' : matId;
    setActiveMaterial(target);
    updateParam('material', target);
  };

  // Toggle Fit filter
  const handleFitChange = (fitId) => {
    const target = activeFit === fitId ? 'all' : fitId;
    setActiveFit(target);
    updateParam('fit', target);
  };

  // Toggle Color Family filter
  const handleColorFamilyChange = (famId) => {
    const target = activeColorFamily === famId ? 'all' : famId;
    setActiveColorFamily(target);
    updateParam('colorFamily', target);
  };

  // Clear all filters with 1 click
  const handleClearAllFilters = () => {
    setActiveCategory('all');
    setActiveSubcategory('all');
    setActiveSubtype('all');
    setActiveMaterial('all');
    setActiveFit('all');
    setActiveColorFamily('all');
    setSearchParams(new URLSearchParams());
  };

  // Filter and Sort Logic
  const searchQuery = searchParams.get('search') || '';

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...(products || [])];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
      const matchedCat = categoriesList.find(c => c.id === activeCategory || c.slug === activeCategory);
      result = result.filter(p => 
        p.category === activeCategory || 
        (matchedCat && (p.category === matchedCat.id || p.category === matchedCat.slug))
      );
    }

    // 2. Filter by Subcategory
    if (activeSubcategory && activeSubcategory !== 'all') {
      result = result.filter(p => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase());
    }

    // 3. Filter by Subtype (Tier 3)
    if (activeSubtype && activeSubtype !== 'all') {
      const q = activeSubtype.toLowerCase();
      result = result.filter(p => 
        p.subtype?.toLowerCase() === q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // 4. Filter by Material
    if (activeMaterial && activeMaterial !== 'all') {
      const matDef = MATERIAL_OPTIONS.find(m => m.id === activeMaterial);
      if (matDef?.match) {
        result = result.filter(p => {
          const combined = `${p.material || ''} ${p.name || ''} ${p.description || ''} ${p.subcategory || ''}`.toLowerCase();
          return matDef.match.some(term => combined.includes(term));
        });
      }
    }

    // 5. Filter by Fit
    if (activeFit && activeFit !== 'all') {
      const fitDef = FIT_OPTIONS.find(f => f.id === activeFit);
      if (fitDef?.match) {
        result = result.filter(p => {
          const combined = `${p.fit || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return fitDef.match.some(term => combined.includes(term));
        });
      }
    }

    // 6. Filter by Color Family
    if (activeColorFamily && activeColorFamily !== 'all') {
      const family = COLOR_FAMILIES.find(f => f.id === activeColorFamily);
      if (family) {
        result = result.filter(p => {
          const pColors = Array.isArray(p.colors) ? p.colors : [];
          const combined = `${p.name || ''} ${p.description || ''}`.toLowerCase();
          const hasColorMatch = pColors.some(c => 
            family.colors.some(fc => c.toLowerCase().includes(fc.toLowerCase()) || fc.toLowerCase().includes(c.toLowerCase()))
          );
          const hasTextMatch = family.colors.some(fc => combined.includes(fc.toLowerCase()));
          return hasColorMatch || hasTextMatch;
        });
      }
    }

    // 7. Filter by Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.subtype?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q) ||
        p.fit?.toLowerCase().includes(q) ||
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
  }, [activeCategory, activeSubcategory, activeSubtype, activeMaterial, activeFit, activeColorFamily, sortOption, products, searchQuery, categoriesList]);

  // Count active non-category filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'all') count++;
    if (activeSubcategory !== 'all') count++;
    if (activeSubtype !== 'all') count++;
    if (activeMaterial !== 'all') count++;
    if (activeFit !== 'all') count++;
    if (activeColorFamily !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [activeCategory, activeSubcategory, activeSubtype, activeMaterial, activeFit, activeColorFamily, searchQuery]);

  // Product counts by subcategory in active category
  const subcategoryCounts = useMemo(() => {
    const map = {};
    if (!products) return map;
    const inCategory = activeCategory === 'all'
      ? products
      : products.filter(p => {
          const matchedCat = categoriesList.find(c => c.id === activeCategory || c.slug === activeCategory);
          return p.category === activeCategory || (matchedCat && (p.category === matchedCat.id || p.category === matchedCat.slug));
        });

    inCategory.forEach(p => {
      if (p.subcategory) {
        const key = p.subcategory.toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [products, activeCategory, categoriesList]);

  // Product counts by subtype in active subcategory
  const subtypeCounts = useMemo(() => {
    const map = {};
    if (!products || !activeSubcategory || activeSubcategory === 'all') return map;
    const inSubcategory = products.filter(p => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase());
    inSubcategory.forEach(p => {
      if (p.subtype) {
        const key = p.subtype.toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [products, activeSubcategory]);

  const sortOptions = [
    { id: 'featured', label: 'Featured' },
    { id: 'newest', label: 'New Arrivals' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' }
  ];

  const currentSortLabel = sortOptions.find(o => o.id === sortOption)?.label;

  return (
    <div className="flex flex-col min-h-screen bg-white w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="bg-brand-beige/20 py-10 md:py-16 px-4 md:px-6 border-b border-brand-charcoal/5 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-brand-taupe">
            Curated Capsule Wardrobe
          </p>
          <h1 className="text-2xl md:text-5xl font-serif text-brand-charcoal tracking-wide break-words">
            {searchQuery 
              ? `Search: "${searchQuery}"`
              : activeCategory === 'all' 
                ? 'The Complete Collection' 
                : currentCategory?.name || 'The Collection'}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-sans max-w-xl mx-auto pt-1 leading-relaxed">
            {activeCategory === 'tops' ? 'Foundational tees, structured henleys, knitwear polos & heavyweight fleece.' :
             activeCategory === 'bottoms' ? 'Tailored trousers, raw selvedge denim, corduroy & relaxed utility bottoms.' :
             activeCategory === 'outerwear' ? 'Refined shackets, knitwear cardigans & elevated lounge track suits.' :
             activeCategory === 'the-linen-shop' ? 'Pure 100% European flax linen garments crafted for effortless breathability.' :
             activeCategory === 'care-accessories' ? 'Heirloom tools and sustainable accessories designed to extend garment longevity.' :
             'Minimalist garments designed to work harmoniously together across seasons.'}
          </p>
        </div>

        {searchQuery && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('search');
                setSearchParams(params);
              }}
              className="text-xs uppercase font-bold tracking-widest text-brand-charcoal underline underline-offset-4 hover:text-brand-taupe transition-colors cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Shop Container */}
      <div className="flex flex-col md:flex-row max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 md:py-12 gap-8 md:gap-12 overflow-hidden">
        
        {/* Mobile Filter Toggle & Sort Bar */}
        <div className="md:hidden flex justify-between items-center border-b border-brand-charcoal/10 pb-4 w-full">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center space-x-2 text-xs font-bold tracking-wider uppercase text-brand-charcoal px-3 py-2 border border-neutral-300 rounded-xs bg-neutral-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center space-x-1.5 text-xs font-bold tracking-wider uppercase text-brand-charcoal px-3 py-2 border border-neutral-300 rounded-xs bg-neutral-50 cursor-pointer"
            >
              <span>Sort: {currentSortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" />
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
                      className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase transition-colors cursor-pointer ${sortOption === opt.id ? 'bg-brand-beige/30 font-bold' : 'hover:bg-brand-beige/10'}`}
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
        <div className="hidden md:block md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8 pr-2">
            
            {/* 1. Category Tree with Subcategories & Subtypes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe">Categories</h3>
                {activeCategory !== 'all' && (
                  <button 
                    onClick={() => handleCategoryChange('all')}
                    className="text-[10px] uppercase font-bold text-neutral-400 hover:text-black tracking-wider cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {categoriesList.map((cat) => {
                  const isCatActive = activeCategory === cat.id || (cat.slug && activeCategory === cat.slug);
                  const subs = (cat.subcategories || []).map(s => typeof s === 'string' ? { name: s, subtypes: [] } : s);

                  return (
                    <li key={cat.id} className="space-y-1.5">
                      <button
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`text-xs tracking-wider uppercase transition-colors block text-left w-full py-1 cursor-pointer ${
                          isCatActive
                            ? 'font-bold text-brand-charcoal pl-2 border-l-2 border-brand-charcoal'
                            : 'text-neutral-500 hover:text-brand-charcoal'
                        }`}
                      >
                        {cat.name}
                      </button>

                      {/* Tier 2 Subcategories in Sidebar */}
                      {isCatActive && subs.length > 0 && (
                        <ul className="pl-3 border-l border-brand-charcoal/15 space-y-1.5 pt-1">
                          <li>
                            <button
                              onClick={() => handleSubcategoryChange('all')}
                              className={`text-[11px] tracking-wider uppercase block text-left cursor-pointer ${
                                activeSubcategory === 'all'
                                  ? 'font-bold text-brand-charcoal underline underline-offset-4'
                                  : 'text-neutral-400 hover:text-brand-charcoal'
                              }`}
                            >
                              All {cat.name}
                            </button>
                          </li>
                          {subs.map((sub) => {
                            const isSubActive = activeSubcategory.toLowerCase() === sub.name.toLowerCase();
                            const subSubtypes = sub.subtypes || [];

                            return (
                              <li key={sub.name} className="space-y-1">
                                <button
                                  onClick={() => handleSubcategoryChange(sub.name)}
                                  className={`text-[11px] tracking-wider uppercase block text-left cursor-pointer ${
                                    isSubActive
                                      ? 'font-bold text-brand-charcoal underline underline-offset-4'
                                      : 'text-neutral-500 hover:text-brand-charcoal'
                                  }`}
                                >
                                  {sub.name}
                                </button>

                                {/* Tier 3 Subtypes in Sidebar */}
                                {isSubActive && subSubtypes.length > 0 && (
                                  <ul className="pl-2 border-l border-brand-charcoal/20 space-y-1 pt-0.5">
                                    {subSubtypes.map((st) => (
                                      <li key={st}>
                                        <button
                                          onClick={() => handleSubtypeChange(st)}
                                          className={`text-[10px] tracking-wide block text-left cursor-pointer ${
                                            activeSubtype.toLowerCase() === st.toLowerCase()
                                              ? 'font-bold text-brand-charcoal bg-neutral-100 px-1.5 py-0.5 rounded-xs'
                                              : 'text-neutral-400 hover:text-brand-charcoal'
                                          }`}
                                        >
                                          • {st}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 2. Filter by Material */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe">Material</h3>
                {activeMaterial !== 'all' && (
                  <button 
                    onClick={() => handleMaterialChange('all')}
                    className="text-[10px] uppercase font-bold text-neutral-400 hover:text-black tracking-wider cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAL_OPTIONS.map((mat) => {
                  const isSelected = activeMaterial === mat.id;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => handleMaterialChange(mat.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-xs tracking-wide transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold shadow-xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
                      }`}
                    >
                      {mat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Filter by Fit */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe">Fit</h3>
                {activeFit !== 'all' && (
                  <button 
                    onClick={() => handleFitChange('all')}
                    className="text-[10px] uppercase font-bold text-neutral-400 hover:text-black tracking-wider cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FIT_OPTIONS.map((f) => {
                  const isSelected = activeFit === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFitChange(f.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-xs tracking-wide transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold shadow-xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Filter by Color Family */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe">Color Family</h3>
                {activeColorFamily !== 'all' && (
                  <button 
                    onClick={() => handleColorFamilyChange('all')}
                    className="text-[10px] uppercase font-bold text-neutral-400 hover:text-black tracking-wider cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {COLOR_FAMILIES.map((fam) => {
                  const isSelected = activeColorFamily === fam.id;
                  return (
                    <button
                      key={fam.id}
                      onClick={() => handleColorFamilyChange(fam.id)}
                      className={`w-full text-left p-2 rounded-xs border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-brand-charcoal bg-neutral-50 shadow-xs' 
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] tracking-wide ${isSelected ? 'font-bold text-brand-charcoal' : 'text-neutral-700'}`}>
                          {fam.label}
                        </span>
                        <div className="flex items-center -space-x-1">
                          {fam.swatches.slice(0, 4).map((sw, idx) => (
                            <span 
                              key={idx} 
                              className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block shadow-2xs" 
                              style={{ backgroundColor: sw.hex }}
                              title={sw.name}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {fam.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Desktop Sort */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-taupe mb-3">Sort By</h3>
              <ul className="space-y-2">
                {sortOptions.map((opt) => (
                  <li key={opt.id}>
                    <button
                      onClick={() => setSortOption(opt.id)}
                      className={`text-xs flex items-center space-x-2 tracking-wide transition-colors cursor-pointer ${sortOption === opt.id ? 'font-bold text-brand-charcoal' : 'text-neutral-500 hover:text-brand-charcoal'}`}
                    >
                      {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-brand-charcoal" />}
                      <span className={sortOption === opt.id ? '' : 'pl-5.5'}>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reset All Filters Button */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="w-full py-2 px-3 border border-neutral-300 text-neutral-600 hover:text-black hover:border-black text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors rounded-xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear All Filters
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Slide-Over Filter Drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              />

              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-brand-charcoal" />
                    <span className="font-serif font-bold text-sm tracking-wide text-brand-charcoal">Filter & Refine</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Category */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">Category</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {categoriesList.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`text-xs p-2 rounded-xs border text-left truncate transition-colors cursor-pointer ${
                            activeCategory === cat.id ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategory */}
                  {activeSubcategories.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">Subcategory</h4>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSubcategoryChange('all')}
                          className={`text-xs px-2.5 py-1.5 rounded-xs border cursor-pointer ${
                            activeSubcategory === 'all' ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          All {currentCategory?.name}
                        </button>
                        {activeSubcategories.map(sub => (
                          <button
                            key={sub.name}
                            onClick={() => handleSubcategoryChange(sub.name)}
                            className={`text-xs px-2.5 py-1.5 rounded-xs border cursor-pointer ${
                              activeSubcategory.toLowerCase() === sub.name.toLowerCase() ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtype (Tier 3) */}
                  {activeSubtypes.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">{activeSubcategory} Style</h4>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSubtypeChange('all')}
                          className={`text-xs px-2.5 py-1.5 rounded-xs border cursor-pointer ${
                            activeSubtype === 'all' ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          All {activeSubcategory}
                        </button>
                        {activeSubtypes.map(st => (
                          <button
                            key={st}
                            onClick={() => handleSubtypeChange(st)}
                            className={`text-xs px-2.5 py-1.5 rounded-xs border cursor-pointer ${
                              activeSubtype.toLowerCase() === st.toLowerCase() ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">Material</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {MATERIAL_OPTIONS.map(mat => (
                        <button
                          key={mat.id}
                          onClick={() => handleMaterialChange(mat.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-xs border transition-colors cursor-pointer ${
                            activeMaterial === mat.id ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {mat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fit */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">Fit</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {FIT_OPTIONS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => handleFitChange(f.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-xs border transition-colors cursor-pointer ${
                            activeFit === f.id ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Family */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-taupe mb-2">Color Family</h4>
                    <div className="space-y-1.5">
                      {COLOR_FAMILIES.map(fam => (
                        <button
                          key={fam.id}
                          onClick={() => handleColorFamilyChange(fam.id)}
                          className={`w-full text-left p-2 text-xs border rounded-xs flex items-center justify-between cursor-pointer ${
                            activeColorFamily === fam.id ? 'bg-brand-charcoal text-white font-bold border-brand-charcoal' : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          <span>{fam.label}</span>
                          <span className="text-[10px] opacity-75">{fam.description.split(',').slice(0, 2).join(',')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex gap-2">
                  <button
                    onClick={handleClearAllFilters}
                    className="flex-1 py-2.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 rounded-xs cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-2 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black rounded-xs shadow-xs cursor-pointer"
                  >
                    View ({filteredAndSortedProducts.length}) Results
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Product Grid Column */}
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          
          {/* 1. Quick Category Navigation Pills (When viewing All Products) */}
          {activeCategory === 'all' && (
            <div className="flex flex-wrap items-center gap-2 pb-4 mb-6 border-b border-brand-charcoal/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mr-1">
                Browse:
              </span>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-full whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-brand-charcoal text-white font-bold shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* 2. Tier 2: Subcategory Pills Bar (When Category is selected) */}
          {activeCategory !== 'all' && activeSubcategories.length > 0 && (
            <div className="space-y-3 pb-4 mb-6 border-b border-brand-charcoal/10">
              {/* Row 1: Subcategories */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSubcategoryChange('all')}
                  className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-full whitespace-nowrap cursor-pointer ${
                    activeSubcategory === 'all'
                      ? 'bg-brand-charcoal text-white font-bold shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
                  }`}
                >
                  All {currentCategory?.name || 'Items'}
                </button>
                {activeSubcategories.map((sub) => {
                  const isSelected = activeSubcategory.toLowerCase() === sub.name.toLowerCase();
                  const count = subcategoryCounts[sub.name.toLowerCase()];
                  return (
                    <button
                      key={sub.name}
                      onClick={() => handleSubcategoryChange(sub.name)}
                      className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-full whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-charcoal text-white font-bold shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {typeof count === 'number' && (
                        <span className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Tier 3 Sub-types (When subcategory has specific styles/variations) */}
              {activeSubtypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
                    {activeSubcategory} Style:
                  </span>
                  <button
                    onClick={() => handleSubtypeChange('all')}
                    className={`px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-xs transition-colors cursor-pointer border ${
                      activeSubtype === 'all'
                        ? 'bg-neutral-800 text-white border-neutral-800 font-bold'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    All {activeSubcategory}
                  </button>
                  {activeSubtypes.map((st) => {
                    const isSelected = activeSubtype.toLowerCase() === st.toLowerCase();
                    const count = subtypeCounts[st.toLowerCase()];
                    return (
                      <button
                        key={st}
                        onClick={() => handleSubtypeChange(st)}
                        className={`px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-xs transition-colors inline-flex items-center gap-1 cursor-pointer border ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-neutral-800 font-bold'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
                        }`}
                      >
                        <span>{st}</span>
                        {typeof count === 'number' && (
                          <span className={`text-[9px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Active Filters Strip & Result Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-serif italic text-neutral-500 mr-1">
                Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'garment' : 'garments'}
              </span>

              {/* Active Category Tag */}
              {activeCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-charcoal text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>{currentCategory?.name || activeCategory}</span>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryChange('all')}
                    className="hover:text-neutral-300 cursor-pointer ml-0.5"
                    title="Remove Category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Active Subcategory Tag */}
              {activeSubcategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>{activeSubcategory}</span>
                  <button 
                    type="button" 
                    onClick={() => handleSubcategoryChange('all')}
                    className="hover:text-black cursor-pointer ml-0.5"
                    title="Remove Subcategory filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Active Subtype Tag */}
              {activeSubtype !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>Style: {activeSubtype}</span>
                  <button 
                    type="button" 
                    onClick={() => handleSubtypeChange('all')}
                    className="hover:text-neutral-300 cursor-pointer ml-0.5"
                    title="Remove Style filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Active Material Tag */}
              {activeMaterial !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>Material: {MATERIAL_OPTIONS.find(m => m.id === activeMaterial)?.label || activeMaterial}</span>
                  <button 
                    type="button" 
                    onClick={() => handleMaterialChange('all')}
                    className="hover:text-black cursor-pointer ml-0.5"
                    title="Remove Material filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Active Fit Tag */}
              {activeFit !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>Fit: {FIT_OPTIONS.find(f => f.id === activeFit)?.label || activeFit}</span>
                  <button 
                    type="button" 
                    onClick={() => handleFitChange('all')}
                    className="hover:text-black cursor-pointer ml-0.5"
                    title="Remove Fit filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Active Color Family Tag */}
              {activeColorFamily !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span>Color: {COLOR_FAMILIES.find(c => c.id === activeColorFamily)?.label || activeColorFamily}</span>
                  <button 
                    type="button" 
                    onClick={() => handleColorFamilyChange('all')}
                    className="hover:text-black cursor-pointer ml-0.5"
                    title="Remove Color Family filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Clear All button */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-black underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid or Empty State */}
          {!products ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-charcoal"></div>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="py-24 text-center max-w-md mx-auto space-y-4 px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-brand-charcoal">No Matching Garments Found</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We couldn't find any pieces matching that exact combination of filters. Try broadening your selection or resetting filters.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-xs shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
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
