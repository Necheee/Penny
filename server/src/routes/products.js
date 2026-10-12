import express from 'express';
import { initialProducts, initialCategories } from '../data/initialCatalogue.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// In-Memory Data Store (Active Cache synced across requests)
let products = [...initialProducts];
let categories = [...initialCategories];

// ==========================================
// 1. PUBLIC STOREFRONT ROUTES
// ==========================================

/**
 * GET /api/products
 * Fetch catalogue with optional category, search, and featured filters
 */
router.get('/', (req, res) => {
  try {
    let result = [...products];
    const { category, featured, search } = req.query;

    if (category && category !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (featured === 'true') {
      result = result.filter(p => p.featured === true);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
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
    const { name, category, price, description, images, colors, availableSizes, featured, inStock } = req.body;

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
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);

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
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;

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
 * DELETE /api/products/:id
 * Remove a product from the catalogue
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

