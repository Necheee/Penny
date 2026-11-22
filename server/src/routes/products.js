import express from 'express';
import crypto from 'crypto';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { verifyToken } from '../utils/token.js';
import { getPool } from '../utils/cloudDb.js';
import { deleteR2Object } from '../utils/r2.js';
import { minorUnitsToDecimal, toMinorUnits } from '../utils/money.js';

const router = express.Router();

const hasDatabase = () => Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

function normalizePrice(value) {
  return minorUnitsToDecimal(toMinorUnits(value));
}

async function syncProductRelations(clientOrPool, productId, { images, variants }) {
  const isPool = typeof clientOrPool.connect === 'function';
  const client = isPool ? await clientOrPool.connect() : clientOrPool;
  const shouldManageTransaction = isPool;

  try {
    if (shouldManageTransaction) {
      await client.query('BEGIN');
    }

    // 1. Safe Variant Sync (Diff & In-place update to preserve foreign-key references)
    if (Array.isArray(variants)) {
      const existingRes = await client.query(
        'SELECT id, size, color_name, color_hex, stock_quantity, sku FROM product_variants WHERE product_id = $1',
        [productId]
      );
      const existingVariants = existingRes.rows;
      const processedVariantIds = new Set();

      for (const variant of variants) {
        const size = String(variant.size || 'One Size').trim();
        const colorName = String(variant.colorName || variant.color || 'Standard').trim();
        const stockQuantity = Math.max(0, Number(variant.stockQuantity ?? 10));
        const colorHex = variant.colorHex || null;

        // Match existing variant by ID if provided, or by (size, color_name)
        const matched = existingVariants.find(
          v => (variant.id && v.id === variant.id) ||
               (v.size.toLowerCase() === size.toLowerCase() && v.color_name.toLowerCase() === colorName.toLowerCase())
        );

        if (matched) {
          // Update in place — primary key stays stable, order_items & inventory_adjustments are preserved!
          await client.query(`
            UPDATE product_variants
            SET size = $1, color_name = $2, color_hex = $3, stock_quantity = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [size, colorName, colorHex, stockQuantity, matched.id]);
          processedVariantIds.add(matched.id);
        } else {
          // Brand new variant
          const newVariantId = crypto.randomUUID();
          let sku = typeof variant.sku === 'string' && variant.sku.trim() ? variant.sku.trim() : null;
          if (!sku) {
            sku = `${productId}-${size.toLowerCase().replace(/[^a-z0-9]+/g, '')}-${colorName.toLowerCase().replace(/[^a-z0-9]+/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
          }
          await client.query(`
            INSERT INTO product_variants (
              id, product_id, size, color_name, color_hex, stock_quantity, sku, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            newVariantId,
            productId,
            size,
            colorName,
            colorHex,
            stockQuantity,
            sku,
          ]);
          processedVariantIds.add(newVariantId);
        }
      }

      // Handle variants that were removed by the admin
      const removedVariants = existingVariants.filter(v => !processedVariantIds.has(v.id));
      if (removedVariants.length > 0) {
        const removedIds = removedVariants.map(v => v.id);
        // Check if any removed variants are referenced by customer orders
        const refRes = await client.query(
          'SELECT DISTINCT variant_id FROM order_items WHERE variant_id = ANY($1::text[])',
          [removedIds]
        );
        const referencedIds = new Set(refRes.rows.map(r => r.variant_id));

        for (const removed of removedVariants) {
          if (referencedIds.has(removed.id)) {
            // Soft-retire to preserve order snapshots and cancellation integrity
            await client.query(
              'UPDATE product_variants SET stock_quantity = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
              [removed.id]
            );
          } else {
            // Safe to delete because no customer orders reference this variant
            await client.query('DELETE FROM product_variants WHERE id = $1', [removed.id]);
          }
        }
      }
    }

    // 2. Safe Image Sync with Base64 Protection
    if (images && typeof images === 'object') {
      const imageUrls = [
        { url: images.primary, isPrimary: true },
        ...(Array.isArray(images.gallery)
          ? images.gallery.map(url => ({ url, isPrimary: false }))
          : []),
      ].filter(image => typeof image.url === 'string' && image.url.trim());

      // Reject raw base64 data URLs to prevent database/localStorage bloat
      for (const image of imageUrls) {
        if (image.url.startsWith('data:')) {
          throw new Error('Raw base64 data URLs cannot be saved as product images. Upload images to Cloudflare R2 first.');
        }
      }

      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      for (const image of imageUrls) {
        await client.query(`
          INSERT INTO product_images (id, url, is_primary, product_id)
          VALUES ($1, $2, $3, $4)
        `, [crypto.randomUUID(), image.url.trim(), image.isPrimary, productId]);
      }
    }

    if (shouldManageTransaction) {
      await client.query('COMMIT');
    }
  } catch (error) {
    if (shouldManageTransaction) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      client.release();
    }
  }
}

async function loadProductRelations(pool, productRows) {
  if (!productRows.length) return new Map();

  const productIds = productRows.map(row => row.id);
  const [variantResult, imageResult] = await Promise.all([
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

// Helper to convert a PostgreSQL row into a standardized product object
export function formatProductRow(row, relations = {}) {
  if (!row) return null;
  const hasRelationalImages = Array.isArray(relations.images);
  const hasRelationalVariants = Array.isArray(relations.variants);
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
  const relationalVariants = hasRelationalVariants ? relations.variants : [];
  const relationalColors = [...new Set(
    relationalVariants.map(variant => variant.colorName).filter(Boolean),
  )];
  const relationalSizes = [...new Set(
    relationalVariants.map(variant => variant.size).filter(Boolean),
  )];
  const relationalImages = hasRelationalImages
    ? {
        primary: relations.images.find(image => image.is_primary)?.url
          || relations.images[0]?.url
          || '',
        gallery: relations.images
          .filter(image => !image.is_primary)
          .map(image => image.url),
      }
    : null;

  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || '',
    subtype: row.subtype || '',
    price: normalizePrice(row.price ?? 0),
    description: row.description || '',
    material: row.material || '100% Cotton',
    fit: row.fit || 'Relaxed fit',
    care: row.care || 'Machine wash cold.',
    shipping: row.shipping || 'Free delivery on orders above ₦200,000.',
    images: relationalImages || (images || { primary: '', gallery: [] }),
    colors: hasRelationalVariants ? relationalColors : (Array.isArray(colors) ? colors : []),
    availableSizes: hasRelationalVariants
      ? relationalSizes
      : (Array.isArray(availableSizes) ? availableSizes : []),
    featured: !!row.featured,
    inStock: hasRelationalVariants
      ? (row.in_stock !== false && relationalVariants.some(variant => variant.stockQuantity > 0))
      : row.in_stock !== false,
    status: ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(row.status)
      ? row.status
      : (row.is_archived ? 'ARCHIVED' : 'ACTIVE'),
    isArchived: row.status === 'ARCHIVED' || !!row.is_archived,
    variants: relationalVariants,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function validateInventoryAdjustmentInput(body = {}) {
  const quantityDelta = Number(body.quantityDelta);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!Number.isInteger(quantityDelta) || quantityDelta === 0 || !reason) {
    return {
      error: 'A non-zero integer quantityDelta and adjustment reason are required.',
    };
  }

  return { quantityDelta, reason };
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
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Products catalogue requires the PostgreSQL database.',
      });
    }

    const pool = getPool();
    const dbRes = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const relations = await loadProductRelations(pool, dbRes.rows);
    let result = dbRes.rows.map(row => formatProductRow(row, relations.get(row.id)));

    const { category, featured, search, includeArchived, archivedOnly } = req.query;

    const authHeader = req.headers.authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]);
      if (decoded && decoded.role === 'admin') {
        isAdmin = true;
      }
    }

    if (archivedOnly === 'true' && isAdmin) {
      result = result.filter(p => p.status === 'ARCHIVED' || !!p.isArchived);
    } else if (includeArchived === 'true' && isAdmin) {
      // Admin requested all products including archived and drafts
    } else {
      // Public storefront: strictly active, non-archived products
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

    const totalCount = result.length;
    const pageNum = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limitNum = req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 24)) : null;

    if (pageNum && limitNum) {
      const startIndex = (pageNum - 1) * limitNum;
      result = result.slice(startIndex, startIndex + limitNum);
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      totalCount,
      page: pageNum || 1,
      totalPages: limitNum ? Math.ceil(totalCount / limitNum) : 1,
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
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Products catalogue requires the PostgreSQL database.',
      });
    }

    const pool = getPool();
    const dbRes = await pool.query(
      'SELECT * FROM products WHERE id = $1 OR slug = $1 LIMIT 1',
      [id]
    );
    let product = null;
    if (dbRes.rows.length > 0) {
      const relations = await loadProductRelations(pool, dbRes.rows);
      product = formatProductRow(dbRes.rows[0], relations.get(dbRes.rows[0].id));
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
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Product changes require the PostgreSQL database.',
      });
    }

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
      const pool = getPool();
      const countRes = await pool.query(
        "SELECT count(*) FROM products WHERE featured = true AND is_archived = false"
      );
      activeFeaturedCount = parseInt(countRes.rows[0]?.count || 0, 10);

      if (activeFeaturedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Maximum limit of 4 featured products reached. Please unfeature another piece before featuring this one.',
        });
      }
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const rawId = typeof id === 'string' ? id.trim() : '';
      const newId = (rawId && !/^p-\d{1,5}$/.test(rawId))
        ? rawId
        : `p-${crypto.randomUUID()}`;

      // Prevent accidental overwrite by verifying ID uniqueness
      const idCheckRes = await client.query('SELECT id FROM products WHERE id = $1', [newId]);
      if (idCheckRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `A product with ID '${newId}' already exists. Use PUT /api/products/${newId} to update an existing product.`,
        });
      }

      // Generate clean, deduplicated URL slug
      let baseSlug = (req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();
      if (!baseSlug) baseSlug = `product-${crypto.randomBytes(3).toString('hex')}`;
      let finalSlug = baseSlug;

      const slugCheckRes = await client.query('SELECT id FROM products WHERE slug = $1', [finalSlug]);
      if (slugCheckRes.rows.length > 0) {
        finalSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
      }

      const newProduct = {
        id: newId,
        slug: finalSlug,
        name,
        category: category || 'tops',
        subcategory: typeof subcategory === 'string' ? subcategory : subcategory?.name || '',
        subtype: subtype || '',
        price: normalizePrice(price),
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

      const dbRes = await client.query(`
        INSERT INTO products (
          id, slug, name, category, subcategory, subtype, price,
          description, material, fit, care, shipping, images,
          colors, available_sizes, featured, in_stock, is_archived, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
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
        await syncProductRelations(client, newProduct.id, {
          images: newProduct.images,
          variants,
        });

        await client.query('COMMIT');

        const relations = await loadProductRelations(pool, dbRes.rows);
        const persisted = formatProductRow(dbRes.rows[0], relations.get(newProduct.id));
        return res.status(201).json({
          success: true,
          message: 'Product created and saved to cloud database.',
          data: persisted,
        });
      }
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('[PRODUCTS API] DB insert error:', dbErr.message);
      const isClientError = dbErr.message.includes('base64') || dbErr.code === '23505';
      return res.status(isClientError ? 400 : 503).json({
        success: false,
        message: dbErr.message || 'Product could not be saved to the database.',
      });
    } finally {
      client.release();
    }
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
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Product changes require the PostgreSQL database.',
      });
    }

    const { id } = req.params;
    const body = req.body;

    const pool = getPool();
    const checkRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    let existing = null;
    if (checkRes.rows.length > 0) {
      existing = formatProductRow(checkRes.rows[0]);
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
      const countRes = await pool.query(
        "SELECT count(*) FROM products WHERE featured = true AND is_archived = false AND id != $1",
        [id]
      );
      activeFeaturedCount = parseInt(countRes.rows[0]?.count || 0, 10);

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
      price: body.price !== undefined ? normalizePrice(body.price) : existing.price,
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dbRes = await client.query(`
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
          await syncProductRelations(client, id, {
            images: body.images,
            variants: body.variants,
          });
        } else if (body.inStock === false) {
          // Zero out variant stock when admin explicitly marks product out of stock
          await client.query('UPDATE product_variants SET stock_quantity = 0 WHERE product_id = $1', [id]);
        } else if (body.inStock === true) {
          // Restore default stock if all variants were 0
          await client.query('UPDATE product_variants SET stock_quantity = 10 WHERE product_id = $1 AND stock_quantity = 0', [id]);
        }

        await client.query('COMMIT');

        const relations = await loadProductRelations(pool, dbRes.rows);
        const persisted = formatProductRow(dbRes.rows[0], relations.get(id));
        return res.status(200).json({
          success: true,
          message: 'Product updated and persisted to database.',
          data: persisted,
        });
      } else {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Product with ID '${id}' not found for update.`,
        });
      }
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('[PRODUCTS API] DB update error:', dbErr.message);
      const isClientError = dbErr.message.includes('base64');
      return res.status(isClientError ? 400 : 503).json({
        success: false,
        message: dbErr.message || 'Product could not be updated in the database.',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product.',
    });
  }
});

/**
 * PATCH /api/products/:id/variants/:variantId/inventory
 * Applies an auditable admin stock adjustment to a product variant.
 */
router.patch('/:id/variants/:variantId/inventory', requireAuth, requireAdmin, async (req, res) => {
  const { id, variantId } = req.params;
  const { quantityDelta, reason, error } = validateInventoryAdjustmentInput(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }

  if (!hasDatabase()) {
    return res.status(503).json({
      success: false,
      message: 'Inventory adjustments require the PostgreSQL database.',
    });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const variantResult = await client.query(
      'SELECT id, product_id, stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2 FOR UPDATE',
      [variantId, id],
    );
    if (variantResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product variant not found.' });
    }

    const variant = variantResult.rows[0];
    const nextStock = Number(variant.stock_quantity) + quantityDelta;
    if (nextStock < 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Inventory cannot be reduced below zero.' });
    }

    await client.query(
      'UPDATE product_variants SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [nextStock, variantId],
    );
    await client.query(
      `INSERT INTO inventory_adjustments
        (id, variant_id, product_id, quantity_delta, reason, reference, actor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), variantId, id, quantityDelta, reason, req.body?.reference || null, req.user?.id || null],
    );
    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      variant: { id: variantId, productId: id, stockQuantity: nextStock },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PRODUCTS API] Inventory adjustment failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Inventory adjustment could not be completed.',
    });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/products/:id/archive
 * Toggle or set product archived state (Admin only)
 */
router.patch('/:id/archive', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Product changes require the PostgreSQL database.',
      });
    }

    const { id } = req.params;
    const pool = getPool();
    const checkRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    let existing = null;
    if (checkRes.rows.length > 0) {
      existing = formatProductRow(checkRes.rows[0]);
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

    {
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
        return res.status(503).json({
          success: false,
          message: 'Product archive status could not be saved to the database.',
        });
      }
    }
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
    if (!hasDatabase()) {
      return res.status(503).json({
        success: false,
        message: 'Product changes require the PostgreSQL database.',
      });
    }

    const { id } = req.params;
    let removed = null;

    try {
      const pool = getPool();
      const dbRes = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
      if (dbRes.rows.length > 0) {
        removed = formatProductRow(dbRes.rows[0]);
      }
    } catch (dbErr) {
      console.error('[PRODUCTS API] DB delete error:', dbErr.message);
      return res.status(503).json({
        success: false,
        message: 'Product could not be removed from the database.',
      });
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
