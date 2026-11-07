import { products as defaultProducts, categories as defaultCategories, sizes as defaultSizes } from '../data/mockCatalogue';

const getStoredProducts = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('penny_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse stored products in api.js", e);
      }
    }
  }
  return defaultProducts;
};

const getStoredCategories = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('penny_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse stored categories in api.js", e);
      }
    }
  }
  return defaultCategories;
};

const API_BASE = '/api';

// Fetch catalogue from backend API with fallback to localStorage / mock
export const getProducts = async () => {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('penny_products', JSON.stringify(data.data));
        }
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to local storage.", err.message);
  }
  return getStoredProducts();
};

export const getProductById = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn(`Backend API unavailable for product ${id}, falling back.`, err.message);
  }
  const products = getStoredProducts();
  const product = products.find(p => p.id === id || p.slug === id);
  if (!product) throw new Error("Product not found");
  return product;
};

export const getCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const stored = getStoredCategories();
        const map = new Map();
        stored.forEach(c => map.set(c.id, c));
        data.data.forEach(c => {
          const prev = map.get(c.id) || {};
          map.set(c.id, {
            ...prev,
            ...c,
            subcategories: Array.isArray(c.subcategories) ? c.subcategories : (prev.subcategories || []),
          });
        });
        const merged = Array.from(map.values());
        if (typeof window !== 'undefined') {
          localStorage.setItem('penny_categories', JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to local categories.", err.message);
  }
  return getStoredCategories();
};

export const getSizes = async () => {
  return defaultSizes;
};

export const getFeaturedProducts = async () => {
  const products = await getProducts();
  return products.filter(p => p.featured);
};

export const getProductsByCategory = async (categoryId) => {
  const products = await getProducts();
  if (categoryId === 'all') return products;
  return products.filter(p => p.category?.toLowerCase() === categoryId?.toLowerCase());
};

