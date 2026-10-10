import { products, categories, sizes } from '../data/mockCatalogue';

// Simulate network delay to mimic real API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getProducts = async () => {
  await delay(500);
  return products;
};

export const getProductById = async (id) => {
  await delay(300);
  const product = products.find(p => p.id === id);
  if (!product) throw new Error("Product not found");
  return product;
};

export const getCategories = async () => {
  await delay(200);
  return categories;
};

export const getSizes = async () => {
  await delay(100);
  return sizes;
};

export const getFeaturedProducts = async () => {
  await delay(400);
  return products.filter(p => p.featured);
};

export const getProductsByCategory = async (categoryId) => {
  await delay(400);
  if (categoryId === 'all') return products;
  return products.filter(p => p.category === categoryId);
};
