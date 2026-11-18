import express from 'express';
import crypto from 'crypto';
import { initialProducts, initialCategories } from '../data/initialCatalogue.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';
import { getPool } from '../utils/cloudDb.js';
import { deleteR2Object } from '../utils/r2.js';

const router = express.Router();

const hasDatabase = () => Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

async function syncProductRelations(pool, productId, { images, variants }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (Array.isArray(variants)) {
      await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
      for (const variant of variants) {
        await client.query(`
          INSERT INTO product_variants (
            id, product_id, size, color_name, color_hex, stock_quantity, sku
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          variant.id || crypto.randomUUID(),
          productId,
          String(variant.size || 'One Size'),
          String(variant.colorName || variant.color || 'Standard'),
          variant.colorHex || null,
          Math.max(0, Number(variant.stockQuantity ?? 0)),
          variant.sku || null,
        ]);
      }
    }

    if (images && typeof images === 'object') {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      const imageUrls = [
        { url: images.primary, isPrimary: true },
        ...(Array.isArray(images.gallery)
          ? images.gallery.map(url => ({ url, isPrimary: false }))
          : []),
      ].filter(image => typeof image.url === 'string' && image.url.trim());

      for (const image of imageUrls) {
        await client.query(`
          INSERT INTO product_images (id, url, is_primary, product_id)
          VALUES ($1, $2, $3, $4)
        `, [crypto.randomUUID(), image.url.trim(), image.isPrimary, productId]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function loadProductRelations(pool, productRows) {
  if (!productRows.length) return new Map();

  const productIds = productRows.map(row => row.id);
  let variantResult;
  let imageResult;
  try {
    [variantResult, imageResult] = await Promise.all([
      pool.query(`
        SELECT id, product_id, size, color_name, color_hex, stock_quantity, sku
        FROM product_variants
        WHERE product_id = ANY($1::text[])
        ORDER BY size, color_name
      `, [productIds]),
      pool.query(`
        SELECT id, product_id, url, public_id, is_primary
        FROM product_images
        WHERE product_id = ANY($1::text[])
        ORDER BY is_primary DESC, created_at ASC
      `, [productIds]),
    ]);
  } catch (error) {
    console.warn('[PRODUCTS API] Relational catalogue tables unavailable; using legacy product fields:', error.message);
    return new Map(productIds.map(id => [id, { variants: [], images: [] }]));
  }

  const relations = new Map();
  for (const id of productIds) {
    const variants = variantResult.rows
      .filter(row => row.product_id === id)
      .map(row => ({
        id: row.id,
        size: row.size,
        colorName: row.color_name,
        colorHex: row.color_hex,
        stockQuantity: Number(row.stock_quantity),
        sku: row.sku,
      }));
    const images = imageResult.rows.filter(row => row.product_id === id);
    relations.set(id, { variants, images });
  }
  return relations;
}

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
  status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(p.status)
    ? p.status
    : (p.isArchived ? 'ARCHIVED' : 'ACTIVE'),
  isArchived: p.status === 'ARCHIVED' || !!p.isArchived,
}));
writeJsonFile('products.json', products);

// Helper to convert a PostgreSQL row into a standardized product object
export function formatProductRow(row, relations = {}) {
  if (!row) return null;
  let images = row.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = { primary: '', gallery: [] }; }
  }
  let colors = row.colors;
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = []; }
  }
  let availableSizes = row.available_sizes;
  if (typeof availableSizes === 'string') {
    try { availableSizes = JSON.parse(availableSizes); } catch { availableSizes = []; }
  }

  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || '',
    subtype: row.subtype || '',
    price: Number(row.price) || 0,
    description: row.description || '',
    material: row.material || '100% Cotton',
    fit: row.fit || 'Relaxed fit',
    care: row.care || 'Machine wash cold.',
    shipping: row.shipping || 'Free delivery on orders above ₦200,000.',
    images: relations.images?.length
      ? {
          primary: relations.images.find(image => image.is_primary)?.url || relations.images[0].url,
          gallery: relations.images.filter(image => !image.is_primary).map(image => image.url),
        }
      : (images || { primary: '', gallery: [] }),
    colors: Array.isArray(colors) ? colors : [],
    availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
    featured: !!row.featured,
    inStock: row.in_stock !== false,
    status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(row.status)
      ? row.status
      : (row.is_archived ? 'ARCHIVED' : 'ACTIVE'),
    isArchived: row.status === 'ARCHIVED' || !!row.is_archived,
    variants: relations.variants || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// ==========================================
// 1. PUBLIC STOREFRONT ROUTES
// ==========================================

/**
 * GET /api/products
 * Fetch catalogue with optional category, search, and featured filters.
 * Synchronized with Neon Cloud Database when available.
 */
router.get('/', async (req, res) => {
  try {
    let result = [];

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        if (dbRes.rows && dbRes.rows.length > 0) {
          const relations = await loadProductRelations(pool, dbRes.rows);
          result = dbRes.rows.map(row => formatProductRow(row, relations.get(row.id)));
          // Keep local cache in sync
          products = [...result];
          writeJsonFile('products.json', products);
        }
      } catch (dbErr) {
        console.warn('[PRODUCTS API] Neon DB read error, using local fallback:', dbErr.message);
      }
    }

    if (result.length === 0) {
      result = [...products];
    }

    const { category, featured, search, includeArchived, archivedOnly } = req.query;

    if (archivedOnly === 'true') {
      result = result.filter(p => p.status === 'ARCHIVED' || !!p.isArchived);
    } else if (includeArchived !== 'true') {
      result = result.filter(p => p.status === 'ACTIVE' && !p.isArchived);
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query(
          'SELECT * FROM products WHERE id = $1 OR slug = $1 LIMIT 1',
          [id]
        );
        if (dbRes.rows.length > 0) {
          const relations = await loadProductRelations(pool, dbRes.rows);
          product = formatProductRow(dbRes.rows[0], relations.get(dbRes.rows[0].id));
        }
      } catch (dbErr) {
        console.warn('[PRODUCTS API] Single product DB lookup fallback:', dbErr.message);
      }
    }

    if (!product) {
      product = products.find(p => p.id === id || p.slug === id);
    }

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
 * Create a new product piece with immediate persistence to Neon PostgreSQL
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      id,
      name,
      category,
      price,
      description,
      material,
      fit,
      care,
      shipping,
      images,
      colors,
      availableSizes,
      variants,
      featured,
      inStock,
      isArchived,
      status,
      subcategory,
      subtype
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required.',
      });
    }

    // Enforce maximum 4 featured products rule
    if (featured === true) {
      let activeFeaturedCount = 0;
      if (hasDatabase()) {
        try {
          const pool = getPool();
          const countRes = await pool.query(
            "SELECT count(*) FROM products WHERE featured = true AND is_archived = false"
          );
          activeFeaturedCount = parseInt(countRes.rows[0]?.count || 0, 10);
        } catch {}
      } else {
        activeFeaturedCount = products.filter(p => p.featured && !p.isArchived).length;
      }

      if (activeFeaturedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Maximum limit of 4 featured products reached. Please unfeature another piece before featuring this one.',
        });
      }
    }

    const newId = id || `p-${Date.now().toString().slice(-4)}`;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = {
      id: newId,
      slug,
      name,
      category: category || 'tops',
      subcategory: typeof subcategory === 'string' ? subcategory : subcategory?.name || '',
      subtype: subtype || '',
      price: Number(price) || 0,
      description: description || '',
      material: material || '100% Cotton',
      fit: fit || 'Relaxed fit',
      care: care || 'Machine wash cold.',
      shipping: shipping || 'Free delivery on orders above ₦200,000.',
      images: images || {
        primary: '/images/products/linen-set-1.jpg',
        gallery: []
      },
      colors: Array.isArray(colors) ? colors : ['Black', 'White'],
      availableSizes: Array.isArray(availableSizes) ? availableSizes : ['S', 'M', 'L', 'XL'],
      featured: !!featured,
      inStock: inStock !== false,
      status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)
        ? status
        : (isArchived ? 'ARCHIVED' : 'ACTIVE'),
      isArchived: status !== undefined ? status === 'ARCHIVED' : !!isArchived,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query(`
          INSERT INTO products (
            id, slug, name, category, subcategory, subtype, price,
            description, material, fit, care, shipping, images,
            colors, available_sizes, featured, in_stock, is_archived, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            category = EXCLUDED.category,
            subcategory = EXCLUDED.subcategory,
            subtype = EXCLUDED.subtype,
            price = EXCLUDED.price,
            description = EXCLUDED.description,
            material = EXCLUDED.material,
            fit = EXCLUDED.fit,
            care = EXCLUDED.care,
            shipping = EXCLUDED.shipping,
            images = EXCLUDED.images,
            colors = EXCLUDED.colors,
            available_sizes = EXCLUDED.available_sizes,
            featured = EXCLUDED.featured,
            in_stock = EXCLUDED.in_stock,
            is_archived = EXCLUDED.is_archived,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *;
        `, [
          newProduct.id,
          newProduct.slug,
          newProduct.name,
          newProduct.category,
          newProduct.subcategory,
          newProduct.subtype,
          newProduct.price,
          newProduct.description,
          newProduct.material,
          newProduct.fit,
          newProduct.care,
          newProduct.shipping,
          JSON.stringify(newProduct.images),
          JSON.stringify(newProduct.colors),
          JSON.stringify(newProduct.availableSizes),
          newProduct.featured,
          newProduct.inStock,
          newProduct.isArchived,
          newProduct.status
        ]);

        if (dbRes.rows.length > 0) {
          await syncProductRelations(pool, newProduct.id, {
            images: newProduct.images,
            variants,
          });
          const relations = await loadProductRelations(pool, dbRes.rows);
          const persisted = formatProductRow(dbRes.rows[0], relations.get(newProduct.id));
          products.unshift(persisted);
          writeJsonFile('products.json', products);
          return res.status(201).json({
            success: true,
            message: 'Product created and saved to cloud database.',
            data: persisted,
          });
        }
      } catch (dbErr) {
        console.error('[PRODUCTS API] DB insert error:', dbErr.message);
      }
    }

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
 * Update an existing product with immediate Neon PostgreSQL persistence
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let existing = products.find(p => p.id === id);

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const checkRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkRes.rows.length > 0) {
          existing = formatProductRow(checkRes.rows[0]);
        }
      } catch (e) {
        console.warn('[PRODUCTS API] DB lookup error during update:', e.message);
      }
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    // Enforce maximum 4 featured products rule when updating
    if (body.featured === true && !existing.featured) {
      let activeFeaturedCount = 0;
      if (hasDatabase()) {
        try {
          const pool = getPool();
          const countRes = await pool.query(
            "SELECT count(*) FROM products WHERE featured = true AND is_archived = false AND id != $1",
            [id]
          );
          activeFeaturedCount = parseInt(countRes.rows[0]?.count || 0, 10);
        } catch {}
      } else {
        activeFeaturedCount = products.filter(p => p.featured && !p.isArchived && p.id !== id).length;
      }

      if (activeFeaturedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Maximum limit of 4 featured products reached. Please unfeature another piece before featuring this one.',
        });
      }
    }

    const updated = {
      ...existing,
      ...body,
      price: body.price !== undefined ? Number(body.price) : existing.price,
      subcategory: body.subcategory !== undefined
        ? (typeof body.subcategory === 'string' ? body.subcategory : body.subcategory?.name || '')
        : existing.subcategory,
      subtype: body.subtype !== undefined ? body.subtype : existing.subtype,
      isArchived: body.status !== undefined
        ? body.status === 'ARCHIVED'
        : (body.isArchived !== undefined ? !!body.isArchived : existing.isArchived),
      status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(body.status)
        ? body.status
        : (body.isArchived === true
          ? 'ARCHIVED'
          : (body.isArchived === false ? 'ACTIVE' : (existing.status || 'ACTIVE'))),
      featured: body.featured !== undefined ? !!body.featured : existing.featured,
      inStock: body.inStock !== undefined ? !!body.inStock : existing.inStock,
      updatedAt: new Date().toISOString(),
    };

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query(`
          UPDATE products SET
            name = $2,
            slug = $3,
            category = $4,
            subcategory = $5,
            subtype = $6,
            price = $7,
            description = $8,
            material = $9,
            fit = $10,
            care = $11,
            shipping = $12,
            images = $13,
            colors = $14,
            available_sizes = $15,
            featured = $16,
            in_stock = $17,
            is_archived = $18,
            status = $19,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *;
        `, [
          updated.id,
          updated.name,
          updated.slug,
          updated.category,
          updated.subcategory,
          updated.subtype,
          updated.price,
          updated.description,
          updated.material,
          updated.fit,
          updated.care,
          updated.shipping,
          JSON.stringify(updated.images),
          JSON.stringify(updated.colors),
          JSON.stringify(updated.availableSizes),
          updated.featured,
          updated.inStock,
          updated.isArchived,
          updated.status
        ]);

        if (dbRes.rows.length > 0) {
          if (Array.isArray(body.variants) || body.images !== undefined) {
            await syncProductRelations(pool, id, {
              images: body.images,
              variants: body.variants,
            });
          }
          const relations = await loadProductRelations(pool, dbRes.rows);
          const persisted = formatProductRow(dbRes.rows[0], relations.get(id));
          const idx = products.findIndex(p => p.id === id);
          if (idx !== -1) products[idx] = persisted;
          else products.unshift(persisted);
          writeJsonFile('products.json', products);

          return res.status(200).json({
            success: true,
            message: 'Product updated and persisted to database.',
            data: persisted,
          });
        }
      } catch (dbErr) {
        console.error('[PRODUCTS API] DB update error:', dbErr.message);
      }
    }

    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = updated;
    }
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
 */
router.patch('/:id/archive', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let existing = products.find(p => p.id === id);

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const checkRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkRes.rows.length > 0) {
          existing = formatProductRow(checkRes.rows[0]);
        }
      } catch (e) {
        console.warn('[PRODUCTS API] DB lookup error:', e.message);
      }
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    const nextArchived = req.body.isArchived !== undefined
      ? !!req.body.isArchived
      : !existing.isArchived;

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query(`
          UPDATE products SET
            is_archived = $2,
            status = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *;
        `, [id, nextArchived, nextArchived ? 'ARCHIVED' : 'ACTIVE']);

        if (dbRes.rows.length > 0) {
          const persisted = formatProductRow(dbRes.rows[0]);
          const idx = products.findIndex(p => p.id === id);
          if (idx !== -1) products[idx] = persisted;
          writeJsonFile('products.json', products);

          return res.status(200).json({
            success: true,
            message: nextArchived
              ? 'Product archived successfully. Hidden from storefront.'
              : 'Product unarchived and restored to storefront.',
            data: persisted,
          });
        }
      } catch (dbErr) {
        console.error('[PRODUCTS API] DB archive update error:', dbErr.message);
      }
    }

    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        status: nextArchived ? 'ARCHIVED' : 'ACTIVE',
        isArchived: nextArchived,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile('products.json', products);
      return res.status(200).json({
        success: true,
        message: nextArchived
          ? 'Product archived successfully.'
          : 'Product unarchived and restored to storefront.',
        data: products[idx],
      });
    }

    return res.status(404).json({
      success: false,
      message: `Product with ID '${id}' not found.`,
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
 * Remove a product permanently from Neon DB and persistent storage
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let removed = null;

    if (hasDatabase()) {
      try {
        const pool = getPool();
        const dbRes = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (dbRes.rows.length > 0) {
          removed = formatProductRow(dbRes.rows[0]);
        }
      } catch (dbErr) {
        console.error('[PRODUCTS API] DB delete error:', dbErr.message);
      }
    }

    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const spliced = products.splice(index, 1)[0];
      if (!removed) removed = spliced;
      writeJsonFile('products.json', products);
    }

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found.`,
      });
    }

    // Automatically clean up associated images from Cloudflare R2 bucket
    try {
      const primaryImg = removed.images?.primary || (typeof removed.images === 'string' ? removed.images : '');
      if (primaryImg && (primaryImg.includes('r2.dev') || primaryImg.includes('r2.cloudflarestorage.com'))) {
        deleteR2Object(primaryImg).catch(() => {});
      }
      if (Array.isArray(removed.images?.gallery)) {
        removed.images.gallery.forEach(img => {
          if (img && (img.includes('r2.dev') || img.includes('r2.cloudflarestorage.com'))) {
            deleteR2Object(img).catch(() => {});
          }
        });
      }
    } catch (cleanupErr) {
      console.warn('[PRODUCTS API] R2 image cleanup notice:', cleanupErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Product removed from catalogue permanently.',
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
