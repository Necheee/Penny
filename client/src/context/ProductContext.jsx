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
  saveAnnouncementsApi
} from '../services/api';

const ProductContext = createContext();

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
  return {
    ...p,
    category: cat,
    subcategory: typeof sub === 'string' ? sub : String(sub || ''),
    isArchived: !!p.isArchived,
  };
};

export function ProductProvider({ children }) {
  // Load products from localStorage or fallback to mockCatalogue (preserves archive status)
  const [allProducts, setAllProducts] = useState(() => {
    let deletedProductIds = new Set();
    try {
      const delSaved = localStorage.getItem('penny_deleted_products');
      if (delSaved) {
        JSON.parse(delSaved).forEach(id => deletedProductIds.add(id));
      }
    } catch {}

    const saved = localStorage.getItem('penny_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(p => p.id));
          const updated = parsed
            .filter(p => !deletedProductIds.has(p.id))
            .map(p => {
              const initP = initialProducts.find(ip => ip.id === p.id);
              return normalizeProduct({
                ...initP,
                ...p,
                subtype: p.subtype || initP?.subtype || '',
                material: p.material || initP?.material || '100% Cotton',
                fit: p.fit || initP?.fit || 'Relaxed fit',
                care: p.care || initP?.care || 'Machine wash cold.',
                shipping: p.shipping || initP?.shipping || 'Free delivery on orders above ₦200,000. Ships within 1-3 business days in Lagos.',
                isArchived: p.isArchived !== undefined ? !!p.isArchived : false,
                featured: p.featured !== undefined ? !!p.featured : false,
              });
            });
          initialProducts.forEach(ip => {
            if (!existingIds.has(ip.id) && !deletedProductIds.has(ip.id)) {
              updated.push(normalizeProduct(ip));
            }
          });
          return updated;
        }
      } catch (e) {
        console.error("Failed to parse saved products", e);
      }
    }
    return initialProducts.filter(ip => !deletedProductIds.has(ip.id)).map(normalizeProduct);
  });

  // Active products for live customer storefront browsing
  const products = allProducts.filter(p => !p.isArchived);

  // Archived products saved in admin for easy retrieval
  const archivedProducts = allProducts.filter(p => !!p.isArchived);

  // Load categories from localStorage or fallback (respects permanent deletions and excludes obsolete sets)
  const [categories, setCategories] = useState(() => {
    let deletedIds = new Set(['sets', 'two-piece-sets']);
    try {
      const deletedSaved = localStorage.getItem('penny_deleted_categories');
      if (deletedSaved) {
        const parsedDeleted = JSON.parse(deletedSaved);
        parsedDeleted.forEach(id => deletedIds.add(id));
      }
      deletedIds.add('sets');
      deletedIds.add('two-piece-sets');
      localStorage.setItem('penny_deleted_categories', JSON.stringify(Array.from(deletedIds)));
    } catch {}

    const saved = localStorage.getItem('penny_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.slug));
          return filtered;
        }
      } catch (e) {
        console.error("Failed to parse saved categories", e);
      }
    }
    return initialCategories.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.slug));
  });

  const [sizes] = useState(initialSizes);

  // Dynamic Announcement Bar Messages
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('penny_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved announcements", e);
      }
    }
    return [
      "Enjoy free shipping on orders above ₦200,000",
      "Lagos delivery in 1 to 3 days",
      "Pieces designed to work perfectly together"
    ];
  });

  // Dynamic Size Guide Data: Exactly 3 categories as specified (Shirts, Shorts, Trousers)
  const [sizeGuideData, setSizeGuideData] = useState(() => {
    const defaultGuides = {
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
    };

    const saved = localStorage.getItem('penny_size_guide');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed.sets; // permanently purge sets
        delete parsed.bottoms; // migrated to shorts and trousers
        delete parsed.tops; // user requested only shirts, shorts, trousers
        return {
          ...defaultGuides,
          ...parsed
        };
      } catch (e) {
        console.error("Failed to parse saved size guide", e);
      }
    }
    return defaultGuides;
  });

  // Sync announcements & size guide to storage
  useEffect(() => {
    localStorage.setItem('penny_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('penny_size_guide', JSON.stringify(sizeGuideData));
  }, [sizeGuideData]);

  // Sync with live backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function syncBackendCatalogue() {
      try {
        let deletedProductIds = new Set();
        try {
          const delSaved = localStorage.getItem('penny_deleted_products');
          if (delSaved) {
            JSON.parse(delSaved).forEach(id => deletedProductIds.add(id));
          }
        } catch {}

        const [liveProducts, liveCategories, liveAnnouncements] = await Promise.all([
          getProducts({ includeArchived: true }),
          getCategories(),
          getAnnouncementsApi().catch(() => null),
        ]);

        if (isMounted) {
          if (Array.isArray(liveProducts) && liveProducts.length > 0) {
            const activeLive = liveProducts
              .filter(p => !deletedProductIds.has(p.id))
              .map(normalizeProduct);
            const liveMap = new Map(activeLive.map(p => [p.id, p]));

            setAllProducts((prev) => {
              const combined = [...activeLive];
              // Preserve client-added products not yet in backend
              prev.forEach(localP => {
                if (!liveMap.has(localP.id) && !deletedProductIds.has(localP.id) && (localP.id.startsWith('p-custom') || !initialProducts.some(ip => ip.id === localP.id))) {
                  combined.unshift(normalizeProduct(localP));
                }
              });
              try {
                localStorage.setItem('penny_products', JSON.stringify(combined));
              } catch (storageErr) {
                console.warn('localStorage quota warning on catalogue sync:', storageErr);
              }
              return combined;
            });
          }
          if (Array.isArray(liveCategories) && liveCategories.length > 0) {
            let deletedIds = new Set(['sets', 'two-piece-sets']);
            try {
              const deletedSaved = localStorage.getItem('penny_deleted_categories');
              if (deletedSaved) {
                const parsed = JSON.parse(deletedSaved);
                parsed.forEach(id => deletedIds.add(id));
              }
            } catch {}

            const activeLiveCats = liveCategories.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.slug));
            setCategories(activeLiveCats);
            localStorage.setItem('penny_categories', JSON.stringify(activeLiveCats));
          }
          if (Array.isArray(liveAnnouncements) && liveAnnouncements.length > 0) {
            setAnnouncements(liveAnnouncements);
            localStorage.setItem('penny_announcements', JSON.stringify(liveAnnouncements));
          }
        }
      } catch (err) {
        console.warn("Could not sync with live backend catalogue, using local cached data.", err);
      }
    }
    syncBackendCatalogue();
    return () => { isMounted = false; };
  }, []);

  // Sync all products (including archived) to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('penny_products', JSON.stringify(allProducts));
  }, [allProducts]);

  // Sync categories to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('penny_categories', JSON.stringify(categories));
  }, [categories]);

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
    setAllProducts((prev) => {
      const updated = [finalProduct, ...prev.filter(p => p.id !== finalProduct.id)];
      try {
        localStorage.setItem('penny_products', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn('localStorage quota warning on addProduct:', storageErr);
      }
      return updated;
    });
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

    setAllProducts((prev) => {
      const updated = prev.map((p) => (p.id === normalized.id ? normalized : p));
      try {
        localStorage.setItem('penny_products', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn('localStorage quota warning on updateProduct:', storageErr);
      }
      return updated;
    });
    return normalized;
  };

  // 3. Delete Product permanently from Cloud Database & Storage
  const deleteProduct = async (productId) => {
    try {
      const delSaved = localStorage.getItem('penny_deleted_products');
      const delIds = new Set(delSaved ? JSON.parse(delSaved) : []);
      delIds.add(productId);
      localStorage.setItem('penny_deleted_products', JSON.stringify(Array.from(delIds)));
    } catch {}

    setAllProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== productId);
      localStorage.setItem('penny_products', JSON.stringify(filtered));
      return filtered;
    });
    try {
      await deleteProductApi(productId);
    } catch (e) {
      console.warn("Failed to persist product deletion to cloud DB:", e);
    }
  };

  // 4. Archive Product (Soft-hide from storefront while keeping data saved)
  const archiveProduct = async (productId) => {
    setAllProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? { ...p, isArchived: true, archivedAt: new Date().toISOString() }
          : p
      );
      localStorage.setItem('penny_products', JSON.stringify(updated));
      return updated;
    });
    try {
      await toggleArchiveProduct(productId, true);
    } catch (e) {}
  };

  // 5. Unarchive / Restore Product to active storefront
  const unarchiveProduct = async (productId) => {
    setAllProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? { ...p, isArchived: false, archivedAt: null }
          : p
      );
      localStorage.setItem('penny_products', JSON.stringify(updated));
      return updated;
    });
    try {
      await toggleArchiveProduct(productId, false);
    } catch (e) {}
  };

  // 6. Toggle Archive state
  const toggleArchive = async (productId) => {
    let nextStatus = false;
    setAllProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          nextStatus = !p.isArchived;
          return {
            ...p,
            isArchived: nextStatus,
            archivedAt: nextStatus ? new Date().toISOString() : null,
          };
        }
        return p;
      });
      localStorage.setItem('penny_products', JSON.stringify(updated));
      return updated;
    });
    try {
      await toggleArchiveProduct(productId, nextStatus);
    } catch (e) {}
  };

  // 7. Toggle Featured on Homepage
  const toggleFeatured = async (productId) => {
    let nextVal = false;
    setAllProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          nextVal = !p.featured;
          return { ...p, featured: nextVal };
        }
        return p;
      });
      localStorage.setItem('penny_products', JSON.stringify(updated));
      return updated;
    });
    try {
      await updateProductApi(productId, { featured: nextVal });
    } catch (e) {
      console.warn("Failed to persist featured state:", e);
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

  // 6. Category & Subcategory Management
  const addCategory = async (newCat) => {
    // If it was previously recorded as deleted, restore it
    try {
      const deletedSaved = localStorage.getItem('penny_deleted_categories');
      if (deletedSaved) {
        const deletedIds = new Set(JSON.parse(deletedSaved));
        deletedIds.delete(newCat.id);
        if (newCat.slug) deletedIds.delete(newCat.slug);
        localStorage.setItem('penny_deleted_categories', JSON.stringify(Array.from(deletedIds)));
      }
    } catch {}

    const catWithSubs = {
      ...newCat,
      subcategories: Array.isArray(newCat.subcategories) ? newCat.subcategories : []
    };
    setCategories((prev) => {
      const updated = [...prev, catWithSubs];
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catWithSubs)
      });
    } catch (err) {
      console.warn("Backend category sync note:", err);
    }
  };

  const deleteCategory = async (catId) => {
    // Record in deleted categories set so it NEVER resurrects
    try {
      const deletedSaved = localStorage.getItem('penny_deleted_categories');
      const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);
      deletedIds.add(catId);
      const targetCat = categories.find(c => c.id === catId || c.slug === catId);
      if (targetCat?.id) deletedIds.add(targetCat.id);
      if (targetCat?.slug) deletedIds.add(targetCat.slug);
      localStorage.setItem('penny_deleted_categories', JSON.stringify(Array.from(deletedIds)));
    } catch {}

    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId && c.slug !== catId);
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/categories/${encodeURIComponent(catId)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Backend category delete note:", err);
    }
  };

  // Helper to extract name whether subcategory is string or object
  const getSubName = (s) => (typeof s === 'string' ? s : s?.name || '').trim();

  // Update an existing category (name, slug, displayOrder, subcategories)
  const updateCategory = async (categoryId, updatedData) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          return {
            ...cat,
            ...updatedData,
            subcategories: updatedData.subcategories !== undefined ? updatedData.subcategories : cat.subcategories,
          };
        }
        return cat;
      });
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

    setCategories((prev) => {
      const updated = prev.map((cat) => {
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
      });
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories/${encodeURIComponent(typeof oldSubName === 'string' ? oldSubName : oldSubName?.name || '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

    setCategories((prev) => {
      const updated = prev.map((cat) => {
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
      });
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.id === categoryId || cat.slug === categoryId) {
          const currentSubs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
          return {
            ...cat,
            subcategories: currentSubs.filter(s => getSubName(s).toLowerCase() !== cleanSub)
          };
        }
        return cat;
      });
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories/${encodeURIComponent(rawSubName)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Backend subcategory delete sync note:", err);
    }
  };

  // 7. Announcement Bar Management
  const updateAnnouncements = async (newAnnouncements) => {
    if (Array.isArray(newAnnouncements)) {
      setAnnouncements(newAnnouncements);
      localStorage.setItem('penny_announcements', JSON.stringify(newAnnouncements));
      try {
        await saveAnnouncementsApi(newAnnouncements);
      } catch (e) {
        console.warn("Backend announcement sync note:", e);
      }
    }
  };

  // 8. Size Guide Content & Headings Management
  const updateSizeGuide = (categoryKey, updatedCategoryData) => {
    setSizeGuideData((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        ...updatedCategoryData,
      },
    }));
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

