import { sizes as defaultSizes } from '../data/mockCatalogue';

const API_BASE = '/api';
const LIVE_BACKEND_URL = 'https://penny-kbrh.onrender.com';

/**
 * Universal safeFetch with seamless live backend fallback for local development.
 * If local dev proxy is offline (e.g. 502/503/504 or ECONNREFUSED on port 5000),
 * it automatically routes the request to the live Render backend.
 */
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if ((res.status === 502 || res.status === 503 || res.status === 504) && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const cleanPath = url.startsWith('http') ? (new URL(url).pathname + new URL(url).search) : url;
      const fallbackUrl = `${LIVE_BACKEND_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
      console.warn(`[API] Local proxy returned status ${res.status}. Seamlessly falling back to live cloud backend:`, fallbackUrl);
      return await fetch(fallbackUrl, options);
    }
    return res;
  } catch (err) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const cleanPath = url.startsWith('http') ? (new URL(url).pathname + new URL(url).search) : url;
      const fallbackUrl = `${LIVE_BACKEND_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
      console.warn('[API] Local fetch failed, retrying on live cloud backend:', fallbackUrl, err.message);
      return await fetch(fallbackUrl, options);
    }
    throw err;
  }
};

const getAuthHeaders = () => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('penny_admin_token') || localStorage.getItem('penny_token');
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// Fetch catalogue from the backend API. Callers may choose to display a
// previously cached response, but this function never invents catalogue data.
export const getProducts = async (options = {}) => {
  const { includeArchived = true } = options;
  const url = includeArchived ? `${API_BASE}/products?includeArchived=true` : `${API_BASE}/products`;
  const res = await safeFetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || `Catalogue request failed (${res.status}).`);
  }
  return data.data;
};

export const createProductApi = async (productData) => {
  try {
    const res = await safeFetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("Server rejected product creation:", res.status, errData);
      throw new Error(errData.message || `Server error (${res.status}) saving product.`);
    }
  } catch (err) {
    console.warn("Error creating product via API:", err.message);
    throw err;
  }
};

export const updateProductApi = async (id, productData) => {
  try {
    const res = await safeFetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("Server rejected product update:", res.status, errData);
      throw new Error(errData.message || `Server error (${res.status}) updating product.`);
    }
  } catch (err) {
    console.warn(`Error updating product ${id} via API:`, err.message);
    throw err;
  }
};

export const deleteProductApi = async (id) => {
  try {
    const res = await safeFetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn(`Error deleting product ${id} via API:`, err.message);
  }
  return null;
};

export const toggleArchiveProduct = async (id, isArchived) => {
  try {
    const res = await safeFetch(`${API_BASE}/products/${id}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isArchived })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn(`Failed to sync archive status to backend for product ${id}:`, err);
  }
  return null;
};

export const getAnnouncementsApi = async () => {
  try {
    const res = await safeFetch(`${API_BASE}/categories/announcements`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch announcements from API:", err.message);
  }
  return null;
};

export const saveAnnouncementsApi = async (messages) => {
  try {
    const res = await safeFetch(`${API_BASE}/categories/announcements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn("Could not save announcements to API:", err.message);
  }
  return null;
};

export const getSizeGuidesApi = async () => {
  try {
    const res = await safeFetch(`${API_BASE}/categories/size-guides`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch size guides from API:", err.message);
  }
  return null;
};

export const updateSizeGuideApi = async (category, guideData) => {
  try {
    const res = await safeFetch(`${API_BASE}/categories/size-guides/${encodeURIComponent(category)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(guideData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn(`Could not update size guide for ${category} on API:`, err.message);
  }
  return null;
};

export const getProductById = async (id) => {
  const res = await safeFetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.message || `Product request failed (${res.status}).`);
  }
  return data.data;
};

export const getCategories = async () => {
  const res = await safeFetch(`${API_BASE}/categories`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || `Category request failed (${res.status}).`);
  }
  return data.data;
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

