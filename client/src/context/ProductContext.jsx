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
            setCategories(liveCategories);
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
  const addCategory = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (catId) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
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

