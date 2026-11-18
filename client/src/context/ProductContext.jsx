import { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts, categories as initialCategories, sizes as initialSizes } from '../data/mockCatalogue';
import {
  getProducts,
  getCategories,
  toggleArchiveProduct,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getAnnouncementsApi,
  saveAnnouncementsApi,
  getSizeGuidesApi,
  updateSizeGuideApi
} from '../services/api';

const ProductContext = createContext();

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('penny_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper to guarantee product data integrity across the entire application
const normalizeProduct = (p) => {
  if (!p) return p;
  let sub = p.subcategory;
  if (typeof sub === 'object' && sub !== null) {
    sub = sub.name || '';
  }
  let cat = p.category;
  if (cat === 'sets' || cat === 'two-piece-sets') {
    cat = 'the-linen-shop';
  }
  const primaryImg = p.images?.primary || (typeof p.images === 'string' ? p.images : (p.image || '/images/products/linen-set-1.jpg'));
  const galleryImgs = Array.isArray(p.images?.gallery) ? p.images.gallery : [];

  return {
    ...p,
    category: cat,
    subcategory: typeof sub === 'string' ? sub : String(sub || ''),
    status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(p.status)
      ? p.status
      : (p.isArchived ? 'ARCHIVED' : 'ACTIVE'),
    isArchived: p.status === 'ARCHIVED' || !!p.isArchived,
    availableSizes: Array.isArray(p.availableSizes) && p.availableSizes.length > 0 ? p.availableSizes : ['XS', 'S', 'M', 'L', 'XL'],
    colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Black', 'White', 'Charcoal'],
    images: {
      primary: primaryImg,
      gallery: galleryImgs
    },
    price: Number(p.price) || 0,
    inStock: p.inStock !== undefined ? !!p.inStock : true,
  };
};

export function ProductProvider({ children }) {
  // Products initialized directly from persistent live DB cache so on refresh there is NEVER a flicker of mock items!
  const [allProducts, setAllProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('penny_live_catalogue_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct);
        }
      }
    } catch {}
    return initialProducts.map(normalizeProduct);
  });

  // Active products for live customer storefront browsing
  const products = allProducts.filter(p => p.status === 'ACTIVE' && !p.isArchived);

  // Archived products saved in admin for easy retrieval
  const archivedProducts = allProducts.filter(p => !!p.isArchived);

  // Load categories directly from persistent cache or initial mock (excluding obsolete sets)
  const [categories, setCategories] = useState(() => {
    try {
      const cached = localStorage.getItem('penny_live_categories_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(c => c.id !== 'sets' && c.id !== 'two-piece-sets' && c.slug !== 'sets' && c.slug !== 'two-piece-sets');
        }
      }
    } catch {}
    return initialCategories.filter(c => c.id !== 'sets' && c.id !== 'two-piece-sets' && c.slug !== 'sets' && c.slug !== 'two-piece-sets');
  });

  const [sizes] = useState(initialSizes);

  // Dynamic Announcement Bar Messages
  const [announcements, setAnnouncements] = useState([
    "Enjoy free shipping on orders above ₦200,000",
    "Lagos delivery in 1 to 3 days",
    "Pieces designed to work perfectly together"
  ]);

  // Dynamic Size Guide Data: Exactly 3 categories as specified (Shirts, Shorts, Trousers)
  const [sizeGuideData, setSizeGuideData] = useState(() => ({
    shirts: {
      title: "Shirts",
      subtitle: "Oxford Shirts, Linen Tops & Shackets",
      columns: [
        { key: "size", label: "Size" },
        { key: "collar", label: "Collar (CM)" },
        { key: "chest", label: "Chest (CM)" },
        { key: "sleeve", label: "Sleeve (CM)" }
      ],
      rows: [
        { size: "XS", collar: "37", chest: "88 - 93", sleeve: "82" },
        { size: "S", collar: "38 - 39", chest: "93 - 98", sleeve: "84" },
        { size: "M", collar: "40 - 41", chest: "98 - 103", sleeve: "86" },
        { size: "L", collar: "42 - 43", chest: "103 - 108", sleeve: "88" },
        { size: "XL", collar: "44 - 45", chest: "108 - 113", sleeve: "90" },
        { size: "XXL", collar: "46 - 47", chest: "113 - 118", sleeve: "92" }
      ]
    },
    shorts: {
      title: "Shorts",
      subtitle: "Chino Shorts, Sweatshorts, Utility & Linen Shorts",
      columns: [
        { key: "size", label: "Size" },
        { key: "waist", label: "Waist (CM)" },
        { key: "hips", label: "Hips (CM)" },
        { key: "inseam", label: "Inseam (CM)" }
      ],
      rows: [
        { size: "XS", waist: "71 - 76", hips: "88 - 93", inseam: "16" },
        { size: "S", waist: "76 - 81", hips: "93 - 98", inseam: "17" },
        { size: "M", waist: "81 - 86", hips: "98 - 103", inseam: "18" },
        { size: "L", waist: "86 - 91", hips: "103 - 108", inseam: "19" },
        { size: "XL", waist: "91 - 96", hips: "108 - 113", inseam: "20" },
        { size: "XXL", waist: "96 - 101", hips: "113 - 118", inseam: "21" }
      ]
    },
    trousers: {
      title: "Trousers",
      subtitle: "Classic Tailored Pants, Chinos, Utility Pants & Sweatpants",
      columns: [
        { key: "size", label: "Size" },
        { key: "waist", label: "Waist (CM)" },
        { key: "hips", label: "Hips (CM)" },
        { key: "inseam", label: "Inseam (CM)" }
      ],
      rows: [
        { size: "XS", waist: "71 - 76", hips: "88 - 93", inseam: "78" },
        { size: "S", waist: "76 - 81", hips: "93 - 98", inseam: "80" },
        { size: "M", waist: "81 - 86", hips: "98 - 103", inseam: "81" },
        { size: "L", waist: "86 - 91", hips: "103 - 108", inseam: "82" },
        { size: "XL", waist: "91 - 96", hips: "108 - 113", inseam: "83" },
        { size: "XXL", waist: "96 - 101", hips: "113 - 118", inseam: "84" }
      ]
    }
  }));

  // Persist live products and categories to cache whenever updated so page refresh never flickers
  useEffect(() => {
    if (Array.isArray(allProducts) && allProducts.length > 0) {
      try {
        localStorage.setItem('penny_live_catalogue_cache', JSON.stringify(allProducts));
      } catch {}
    }
  }, [allProducts]);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      try {
        localStorage.setItem('penny_live_categories_cache', JSON.stringify(categories));
      } catch {}
    }
  }, [categories]);

  // Sync catalogue with live Neon backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function syncBackendCatalogue() {
      try {
        const [liveProducts, liveCategories, liveAnnouncements, liveSizeGuides] = await Promise.all([
          getProducts({ includeArchived: true }),
          getCategories(),
          getAnnouncementsApi().catch(() => null),
          getSizeGuidesApi().catch(() => null),
        ]);

        if (isMounted) {
          if (Array.isArray(liveProducts) && liveProducts.length > 0) {
            const normalized = liveProducts.map(normalizeProduct);
            setAllProducts(normalized);
            try {
              localStorage.setItem('penny_live_catalogue_cache', JSON.stringify(normalized));
            } catch {}
          }
          if (Array.isArray(liveCategories) && liveCategories.length > 0) {
            const activeLiveCats = liveCategories.filter(
              c => c.id !== 'sets' && c.id !== 'two-piece-sets' && c.slug !== 'sets' && c.slug !== 'two-piece-sets'
            );
            setCategories(activeLiveCats);
            try {
              localStorage.setItem('penny_live_categories_cache', JSON.stringify(activeLiveCats));
            } catch {}
          }
          if (Array.isArray(liveAnnouncements) && liveAnnouncements.length > 0) {
            setAnnouncements(liveAnnouncements);
          }
          if (Array.isArray(liveSizeGuides) && liveSizeGuides.length > 0) {
            const guidesMap = {};
            liveSizeGuides.forEach(sg => {
              if (sg.category) {
                guidesMap[sg.category] = {
                  title: sg.title || (sg.category.charAt(0).toUpperCase() + sg.category.slice(1)),
                  subtitle: sg.subtitle || '',
                  columns: Array.isArray(sg.columns) ? sg.columns : [],
                  rows: Array.isArray(sg.rows) ? sg.rows : []
                };
              }
            });
            setSizeGuideData(prev => ({ ...prev, ...guidesMap }));
          }
        }
      } catch (err) {
        console.warn("Could not sync with live backend catalogue:", err);
      }
    }
    syncBackendCatalogue();
    return () => { isMounted = false; };
  }, []);

  // Admin Actions:
  // 1. Add Product with immediate Cloud Database & Storage persistence
  const addProduct = async (newProduct) => {
    const normalized = normalizeProduct(newProduct);
    let persisted = null;
    try {
      persisted = await createProductApi(normalized);
    } catch (e) {
      console.error("Failed to persist product to cloud DB:", e);
      throw e;
    }

    const finalProduct = persisted ? normalizeProduct(persisted) : normalized;
    setAllProducts((prev) => [finalProduct, ...prev.filter(p => p.id !== finalProduct.id)]);
    return finalProduct;
  };

  // 2. Update Product with immediate Cloud Database & Storage persistence
  const updateProduct = async (updatedProduct) => {
    const normalized = normalizeProduct(updatedProduct);
    try {
      await updateProductApi(normalized.id, normalized);
    } catch (e) {
      console.error("Failed to persist product update to cloud DB:", e);
      throw e;
    }

    setAllProducts((prev) => prev.map((p) => (p.id === normalized.id ? normalized : p)));
    return normalized;
  };

  // 3. Delete Product permanently from Cloud Database & Storage
  const deleteProduct = async (productId) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await deleteProductApi(productId);
    } catch (e) {
      console.warn("Failed to persist product deletion to cloud DB:", e);
    }
  };

  // 4. Archive Product (Soft-hide from storefront while keeping data saved)
  const archiveProduct = async (productId) => {
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: 'ARCHIVED', isArchived: true, archivedAt: new Date().toISOString() }
          : p
      )
    );
    try {
      await toggleArchiveProduct(productId, true);
    } catch (e) {}
  };

  // 5. Unarchive / Restore Product to active storefront
  const unarchiveProduct = async (productId) => {
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: 'ACTIVE', isArchived: false, archivedAt: null }
          : p
      )
    );
    try {
      await toggleArchiveProduct(productId, false);
    } catch (e) {}
  };

  // 6. Toggle Archive state
  const toggleArchive = async (productId) => {
    let nextStatus = false;
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          nextStatus = !p.isArchived;
          return {
            ...p,
            status: nextStatus ? 'ARCHIVED' : 'ACTIVE',
            isArchived: nextStatus,
            archivedAt: nextStatus ? new Date().toISOString() : null,
          };
        }
        return p;
      })
    );
    try {
      await toggleArchiveProduct(productId, nextStatus);
    } catch (e) {}
  };

  // 7. Toggle Featured on Homepage (Capped at strictly 4 active featured items)
  const toggleFeatured = async (productId) => {
    const target = allProducts.find(p => p.id === productId);
    if (!target) return;

    const currentFeaturedCount = allProducts.filter(p => p.featured && !p.isArchived).length;
    if (!target.featured && currentFeaturedCount >= 4) {
      // Reject enabling featured if 4 are already featured
      return false;
    }

    const nextVal = !target.featured;
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, featured: nextVal };
        }
        return p;
      })
    );
    try {
      await updateProductApi(productId, { featured: nextVal });
      return true;
    } catch (e) {
      console.warn("Failed to persist featured state:", e);
      return false;
    }
  };

  // 8. Toggle Stock Availability
  const toggleStock = async (productId) => {
    let nextVal = false;
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          nextVal = !p.inStock;
          return { ...p, inStock: nextVal };
        }
        return p;
      })
    );
    try {
      await updateProductApi(productId, { inStock: nextVal });
    } catch (e) {
      console.warn("Failed to persist stock state:", e);
    }
  };

  // 9. Category & Subcategory Management
  const addCategory = async (newCat) => {
    const catWithSubs = {
      ...newCat,
      subcategories: Array.isArray(newCat.subcategories) ? newCat.subcategories : []
    };
    setCategories((prev) => [...prev, catWithSubs]);

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(catWithSubs)
      });
    } catch (err) {
      console.warn("Backend category sync note:", err);
    }
  };

  const deleteCategory = async (catId) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId && c.slug !== catId));

    try {
      await fetch(`/api/categories/${encodeURIComponent(catId)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
    } catch (err) {
      console.warn("Backend category delete note:", err);
    }
  };

  // Helper to extract name whether subcategory is string or object
  const getSubName = (s) => (typeof s === 'string' ? s : s?.name || '').trim();

  // Update an existing category (name, slug, displayOrder, subcategories)
  const updateCategory = async (categoryId, updatedData) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          return {
            ...cat,
            ...updatedData,
            subcategories: updatedData.subcategories !== undefined ? updatedData.subcategories : cat.subcategories,
          };
        }
        return cat;
      })
    );

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.warn("Backend category update sync note:", err);
    }
  };

  // Update an individual subcategory (rename and/or update subtypes)
  const updateSubcategory = async (categoryId, oldSubName, newSubData) => {
    const cleanOld = (typeof oldSubName === 'string' ? oldSubName : oldSubName?.name || '').trim().toLowerCase();
    if (!cleanOld) return;

    let targetNewName = '';
    let targetSubtypes = [];

    if (typeof newSubData === 'string') {
      targetNewName = newSubData.trim();
    } else if (typeof newSubData === 'object' && newSubData !== null) {
      targetNewName = (newSubData.name || '').trim();
      targetSubtypes = Array.isArray(newSubData.subtypes) ? newSubData.subtypes : [];
    }

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          const currentSubs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
          const newSubs = currentSubs.map((s) => {
            if (getSubName(s).toLowerCase() === cleanOld) {
              return {
                name: targetNewName || getSubName(s),
                subtypes: targetSubtypes.length > 0 
                  ? targetSubtypes 
                  : (typeof s === 'object' && Array.isArray(s.subtypes) ? s.subtypes : [])
              };
            }
            return s;
          });
          return { ...cat, subcategories: newSubs };
        }
        return cat;
      })
    );

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories/${encodeURIComponent(typeof oldSubName === 'string' ? oldSubName : oldSubName?.name || '')}`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          newName: targetNewName,
          subtypes: targetSubtypes,
        }),
      });
    } catch (err) {
      console.warn("Backend subcategory update sync note:", err);
    }
  };

  const addSubcategory = async (categoryId, subcategoryInput, subtypes = []) => {
    let cleanSub = '';
    let cleanSubtypes = [];

    if (typeof subcategoryInput === 'string') {
      cleanSub = subcategoryInput.trim();
      cleanSubtypes = Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()).filter(Boolean) : [];
    } else if (typeof subcategoryInput === 'object' && subcategoryInput !== null) {
      cleanSub = (subcategoryInput.name || '').trim();
      cleanSubtypes = Array.isArray(subcategoryInput.subtypes) 
        ? subcategoryInput.subtypes.map(s => String(s).trim()).filter(Boolean) 
        : (Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()).filter(Boolean) : []);
    }

    if (!cleanSub) return;

    const newSubObj = {
      name: cleanSub,
      subtypes: cleanSubtypes
    };

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          const currentSubs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
          if (currentSubs.some(s => getSubName(s).toLowerCase() === cleanSub.toLowerCase())) {
            return cat;
          }
          return {
            ...cat,
            subcategories: [...currentSubs, newSubObj]
          };
        }
        return cat;
      })
    );

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ subcategory: cleanSub, subtypes: cleanSubtypes })
      });
    } catch (err) {
      console.warn("Backend subcategory add sync note:", err);
    }
  };

  const deleteSubcategory = async (categoryId, subcategoryName) => {
    const rawSubName = typeof subcategoryName === 'string' ? subcategoryName : subcategoryName?.name || '';
    const cleanSub = rawSubName.trim().toLowerCase();
    if (!cleanSub) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          const currentSubs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
          return {
            ...cat,
            subcategories: currentSubs.filter(s => getSubName(s).toLowerCase() !== cleanSub)
          };
        }
        return cat;
      })
    );

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories/${encodeURIComponent(rawSubName)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
    } catch (err) {
      console.warn("Backend subcategory delete sync note:", err);
    }
  };

  // 10. Announcement Bar Management
  const updateAnnouncements = async (newAnnouncements) => {
    if (Array.isArray(newAnnouncements)) {
      setAnnouncements(newAnnouncements);
      try {
        await saveAnnouncementsApi(newAnnouncements);
      } catch (e) {
        console.warn("Backend announcement sync note:", e);
      }
    }
  };

  // 11. Size Guide Content & Headings Management
  const updateSizeGuide = async (categoryKey, updatedCategoryData) => {
    const nextGuide = {
      ...(sizeGuideData[categoryKey] || {}),
      ...updatedCategoryData,
    };
    setSizeGuideData((prev) => ({
      ...prev,
      [categoryKey]: nextGuide,
    }));
    try {
      await updateSizeGuideApi(categoryKey, nextGuide);
    } catch (e) {
      console.warn('Failed to sync size guide to backend API:', e);
    }
  };

  // Queries for storefront:
  const getProductById = (id, includeArchived = false) => 
    (includeArchived ? allProducts : products).find((p) => p.id === id || p.slug === id);
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <ProductContext.Provider
      value={{
        allProducts,
        products,
        archivedProducts,
        categories,
        sizes,
        featuredProducts,
        announcements,
        updateAnnouncements,
        sizeGuideData,
        updateSizeGuide,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        archiveProduct,
        unarchiveProduct,
        toggleArchive,
        toggleFeatured,
        toggleStock,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);

