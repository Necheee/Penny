import { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts, categories as initialCategories, sizes as initialSizes } from '../data/mockCatalogue';
import { getProducts, getCategories } from '../services/api';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  // Load products from localStorage or fallback to mockCatalogue
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('penny_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved products", e);
      }
    }
    return initialProducts;
  });

  // Load categories from localStorage or fallback
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('penny_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved categories", e);
      }
    }
    return initialCategories;
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

  // Dynamic Size Guide Data (Headings, Subtitles, Columns, and Rows)
  const [sizeGuideData, setSizeGuideData] = useState(() => {
    const saved = localStorage.getItem('penny_size_guide');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved size guide", e);
      }
    }
    return {
      tops: {
        title: "Tops & Shirts",
        subtitle: "T-Shirts, Overshirts, Henleys & Sweaters",
        columns: [
          { key: "size", label: "Size" },
          { key: "chest", label: "Chest (CM)" },
          { key: "waist", label: "Waist (CM)" },
          { key: "shoulder", label: "Shoulder (CM)" }
        ],
        rows: [
          { size: "XS", chest: "86 - 91", waist: "71 - 76", shoulder: "42" },
          { size: "S", chest: "91 - 96", waist: "76 - 81", shoulder: "44" },
          { size: "M", chest: "96 - 101", waist: "81 - 86", shoulder: "46" },
          { size: "L", chest: "101 - 106", waist: "86 - 91", shoulder: "48" },
          { size: "XL", chest: "106 - 111", waist: "91 - 96", shoulder: "50" },
          { size: "XXL", chest: "111 - 116", waist: "96 - 101", shoulder: "52" }
        ]
      },
      bottoms: {
        title: "Trousers & Shorts",
        subtitle: "Chinos, Trousers, Cargo & Shorts",
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
      },
      sets: {
        title: "Two-Piece Sets",
        subtitle: "Linen & Cotton Co-ord Sets",
        columns: [
          { key: "size", label: "Size" },
          { key: "chest", label: "Chest (CM)" },
          { key: "waist", label: "Waist (CM)" },
          { key: "hips", label: "Hips (CM)" }
        ],
        rows: [
          { size: "XS", chest: "86 - 91", waist: "71 - 76", hips: "88 - 93" },
          { size: "S", chest: "91 - 96", waist: "76 - 81", hips: "93 - 98" },
          { size: "M", chest: "96 - 101", waist: "81 - 86", hips: "98 - 103" },
          { size: "L", chest: "101 - 106", waist: "86 - 91", hips: "103 - 108" },
          { size: "XL", chest: "106 - 111", waist: "91 - 96", hips: "108 - 113" },
          { size: "XXL", chest: "111 - 116", waist: "96 - 101", hips: "113 - 118" }
        ]
      }
    };
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
        const [liveProducts, liveCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        if (isMounted) {
          if (Array.isArray(liveProducts) && liveProducts.length > 0) {
            setProducts(liveProducts);
          }
          if (Array.isArray(liveCategories) && liveCategories.length > 0) {
            setCategories((prevCategories) => {
              const map = new Map();
              liveCategories.forEach(c => map.set(c.id, c));
              prevCategories.forEach(c => map.set(c.id, c));
              const merged = Array.from(map.values());
              localStorage.setItem('penny_categories', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn("Could not sync with live backend catalogue, using local cached data.", err);
      }
    }
    syncBackendCatalogue();
    return () => { isMounted = false; };
  }, []);

  // Sync products to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('penny_products', JSON.stringify(products));
  }, [products]);

  // Sync categories to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('penny_categories', JSON.stringify(categories));
  }, [categories]);

  // Admin Actions:
  // 1. Add Product
  const addProduct = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  // 2. Update Product
  const updateProduct = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // 3. Delete Product
  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // 4. Toggle Featured on Homepage
  const toggleFeatured = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, featured: !p.featured } : p))
    );
  };

  // 5. Toggle Stock Availability
  const toggleStock = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p))
    );
  };

  // 6. Category Management
  const addCategory = async (newCat) => {
    setCategories((prev) => {
      const updated = [...prev, newCat];
      localStorage.setItem('penny_categories', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
    } catch (err) {
      console.warn("Backend category sync note:", err);
    }
  };

  const deleteCategory = async (catId) => {
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

  // 7. Announcement Bar Management
  const updateAnnouncements = (newAnnouncements) => {
    if (Array.isArray(newAnnouncements)) {
      setAnnouncements(newAnnouncements);
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
  const getProductById = (id) => products.find((p) => p.id === id);
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <ProductContext.Provider
      value={{
        products,
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
        toggleFeatured,
        toggleStock,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);

