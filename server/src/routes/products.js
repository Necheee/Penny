import express from 'express';
import { initialProducts, initialCategories } from '../data/initialCatalogue.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';

const router = express.Router();

// Active Persistent Storage for Products with fallback to initial catalogue
let storedProducts = readJsonFile('products.json', initialProducts) || initialProducts;

// Ensure all initial catalogue products are preserved
const storedIds = new Set(storedProducts.map(p => p.id));
initialProducts.forEach(ip => {
  if (!storedIds.has(ip.id)) {
    storedProducts.push(ip);
  }
});

let products = storedProducts.map(p => ({
  ...p,
  isArchived: !!p.isArchived,
}));
writeJsonFile('products.json', products);

let categories = [...initialCategories];

// ==========================================
// 1. PUBLIC STOREFRONT ROUTES
// ==========================================

/**
 * GET /api/products
 * Fetch catalogue with optional category, search, and featured filters.
 * By default, archived products are excluded from the public storefront.
 * Pass ?includeArchived=true to retrieve all products (e.g. for admin management).
 * Pass ?archivedOnly=true to retrieve only archived pieces.
 */
router.get('/', (req, res) => {
  try {
    let result = [...products];
    const { category, featured, search, includeArchived, archivedOnly } = req.query;

    if (archivedOnly === 'true') {
      result = result.filter(p => !!p.isArchived);
    } else if (includeArchived !== 'true') {
      result = result.filter(p => !p.isArchived);
    }

    if (category && category !== 'all') {
      result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (featured === 'true') {
      result = result.filter(p => p.featured === true);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products catalogue.',
    });
  }
});

/**
 * GET /api/products/:id
 * Retrieve single product details by id or slug
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id || p.slug === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details.',
    });
  }
});

// ==========================================
// 2. ADMIN-GUARDED ROUTES (OWNER ONLY)
// ==========================================

/**
 * POST /api/products
 * Create a new product piece
 */
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name, category, price, description, images, colors, availableSizes, featured, inStock, isArchived } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required.',
      });
    }

    const newId = `p-${Date.now().toString().slice(-4)}`;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = {
      id: newId,
      slug,
      name,
      category: category || 'tops',
      subcategory: req.body.subcategory || '',
      subtype: req.body.subtype || '',
      price: Number(price),
      description: description || '',
      material: req.body.material || '100% Cotton',
      fit: req.body.fit || 'Relaxed fit',
      care: req.body.care || 'Machine wash cold.',
      shipping: req.body.shipping || 'Free delivery on orders above ₦200,000.',
      images: images || {
        primary: '/images/products/linen-set-1.jpg',
        gallery: []
      },
      colors: colors || ['Black', 'White'],
      availableSizes: availableSizes || ['S', 'M', 'L', 'XL'],
      featured: !!featured,
      inStock: inStock !== false,
      isArchived: !!isArchived,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    writeJsonFile('products.json', products);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product.',
    });
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product
 */
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    const existing = products[index];
    const updated = {
      ...existing,
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      isArchived: req.body.isArchived !== undefined ? !!req.body.isArchived : existing.isArchived,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;
    writeJsonFile('products.json', products);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product.',
    });
  }
});

/**
 * PATCH /api/products/:id/archive
 * Toggle or set product archived state (Admin only)
 * Archived products are hidden from live storefront but saved for easy retrieval.
 */
router.patch('/:id/archive', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    const nextArchived = req.body.isArchived !== undefined
      ? !!req.body.isArchived
      : !products[index].isArchived;

    products[index] = {
      ...products[index],
      isArchived: nextArchived,
      archivedAt: nextArchived ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    writeJsonFile('products.json', products);

    return res.status(200).json({
      success: true,
      message: nextArchived
        ? 'Product archived successfully. Hidden from storefront.'
        : 'Product unarchived and restored to storefront.',
      data: products[index],
    });
  } catch (error) {
    console.error('Error toggling archive status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product archive status.',
    });
  }
});

/**
 * DELETE /api/products/:id
 * Remove a product from the catalogue permanently
 */
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    const removed = products.splice(index, 1)[0];
    writeJsonFile('products.json', products);

    return res.status(200).json({
      success: true,
      message: 'Product removed from catalogue.',
      data: removed,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product.',
    });
  }
});

export default router;

