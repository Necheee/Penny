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

// Simulate network delay to mimic real API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getProducts = async () => {
  await delay(200);
  return getStoredProducts();
};

export const getProductById = async (id) => {
  await delay(150);
  const products = getStoredProducts();
  const product = products.find(p => p.id === id);
  if (!product) throw new Error("Product not found");
  return product;
};

export const getCategories = async () => {
  await delay(100);
  return getStoredCategories();
};

export const getSizes = async () => {
  await delay(100);
  return defaultSizes;
};

export const getFeaturedProducts = async () => {
  await delay(150);
  return getStoredProducts().filter(p => p.featured);
};

export const getProductsByCategory = async (categoryId) => {
  await delay(150);
  const products = getStoredProducts();
  if (categoryId === 'all') return products;
  return products.filter(p => p.category === categoryId);
};

