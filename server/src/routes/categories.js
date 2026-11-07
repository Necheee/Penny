import express from 'express';
import { initialCategories, initialSizeGuides } from '../data/initialCatalogue.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';
import { getPool } from '../utils/cloudDb.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Active persistent storage for categories and size guides
let categories = readJsonFile('categories.json', initialCategories) || initialCategories;
let sizeGuides = readJsonFile('sizeGuides.json', initialSizeGuides) || initialSizeGuides;

// Ensure initial categories always have their subcategories array
categories = categories.map(cat => {
  const initial = initialCategories.find(ic => ic.id === cat.id || ic.slug === cat.slug);
  return {
    ...cat,
    subcategories: Array.isArray(cat.subcategories) && cat.subcategories.length > 0
      ? cat.subcategories
      : (initial?.subcategories || [])
  };
});

/**
 * GET /api/categories
 * Retrieve all active product categories with their subcategories
 */
router.get('/', async (req, res) => {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100),
          display_order INTEGER DEFAULT 1,
          subcategories JSONB DEFAULT '[]'::jsonb
        );
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;
      `);
      const dbRes = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
      if (dbRes.rows && dbRes.rows.length > 0) {
        const map = new Map();
        categories.forEach(c => map.set(c.id, c));
        dbRes.rows.forEach(r => {
          let subs = [];
          if (Array.isArray(r.subcategories)) {
            subs = r.subcategories;
          } else if (typeof r.subcategories === 'string') {
            try { subs = JSON.parse(r.subcategories); } catch {}
          } else if (map.get(r.id)?.subcategories) {
            subs = map.get(r.id).subcategories;
          }
          map.set(r.id, {
            id: r.id,
            name: r.name,
            slug: r.slug || r.id,
            displayOrder: r.display_order || map.get(r.id)?.displayOrder || 1,
            subcategories: Array.isArray(subs) ? subs : [],
          });
        });
        categories = Array.from(map.values());
        writeJsonFile('categories.json', categories);
      }
    }
  } catch (err) {
    // Fallback to cached file
  }

  return res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * POST /api/categories
 * Add a new category (Persists to local storage & cloud DB)
 */
router.post('/', async (req, res) => {
  try {
    const { name, slug, subcategories: rawSubs } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const trimmedName = name.trim();
    const generatedSlug = slug?.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newId = generatedSlug;

    // Check if category already exists
    if (categories.some(c => c.id === newId || c.slug === generatedSlug)) {
      return res.status(400).json({
        success: false,
        message: `Category with slug '${generatedSlug}' already exists.`,
      });
    }

    let parsedSubs = [];
    if (Array.isArray(rawSubs)) {
      parsedSubs = rawSubs.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof rawSubs === 'string' && rawSubs.trim()) {
      parsedSubs = rawSubs.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newCategory = {
      id: newId,
      name: trimmedName,
      slug: generatedSlug,
      displayOrder: categories.length + 1,
      subcategories: parsedSubs,
    };

    categories.push(newCategory);
    writeJsonFile('categories.json', categories);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(`
          INSERT INTO categories (id, name, slug, display_order, subcategories)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            display_order = EXCLUDED.display_order,
            subcategories = EXCLUDED.subcategories;
        `, [
          newCategory.id,
          newCategory.name,
          newCategory.slug,
          newCategory.displayOrder,
          JSON.stringify(newCategory.subcategories)
        ]);
      }
    } catch (e) {
      console.warn('[CATEGORIES] DB category sync warning:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Category added successfully.',
      data: newCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create category.',
    });
  }
});

/**
 * POST /api/categories/:id/subcategories
 * Add a subcategory to an existing category
 */
router.post('/:id/subcategories', async (req, res) => {
  try {
    const { id } = req.params;
    const subcategoryName = (req.body.subcategory || req.body.name || '').trim();

    if (!subcategoryName) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory name is required.',
      });
    }

    const category = categories.find(c => c.id === id || c.slug === id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    // Check for duplicate (case-insensitive)
    const exists = category.subcategories.some(s => s.toLowerCase() === subcategoryName.toLowerCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Subcategory '${subcategoryName}' already exists in ${category.name}.`,
      });
    }

    category.subcategories.push(subcategoryName);
    writeJsonFile('categories.json', categories);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(
          'UPDATE categories SET subcategories = $1 WHERE id = $2 OR slug = $2',
          [JSON.stringify(category.subcategories), category.id]
        );
      }
    } catch (e) {
      console.warn('[CATEGORIES] DB subcategory add warning:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Subcategory '${subcategoryName}' added to ${category.name}.`,
      data: category,
    });
  } catch (error) {
    console.error('Error adding subcategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add subcategory.',
    });
  }
});

/**
 * DELETE /api/categories/:id/subcategories/:subName
 * Remove a subcategory from an existing category
 */
router.delete('/:id/subcategories/:subName', async (req, res) => {
  try {
    const { id, subName } = req.params;
    const targetSub = decodeURIComponent(subName).trim().toLowerCase();

    const category = categories.find(c => c.id === id || c.slug === id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    const initialLength = category.subcategories.length;
    category.subcategories = category.subcategories.filter(s => s.toLowerCase() !== targetSub);

    if (category.subcategories.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: `Subcategory '${subName}' not found in ${category.name}.`,
      });
    }

    writeJsonFile('categories.json', categories);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(
          'UPDATE categories SET subcategories = $1 WHERE id = $2 OR slug = $2',
          [JSON.stringify(category.subcategories), category.id]
        );
      }
    } catch (e) {
      console.warn('[CATEGORIES] DB subcategory delete warning:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Subcategory '${subName}' removed from ${category.name}.`,
      data: category,
    });
  } catch (error) {
    console.error('Error removing subcategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete subcategory.',
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Remove a category
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = categories.findIndex(c => c.id === id || c.slug === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    const removed = categories.splice(index, 1)[0];
    writeJsonFile('categories.json', categories);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query('DELETE FROM categories WHERE id = $1 OR slug = $1', [id]);
      }
    } catch (e) {
      console.warn('[CATEGORIES] DB category delete warning:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Category removed successfully.',
      data: removed,
    });
  } catch (error) {
    console.error('Error removing category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
    });
  }
});

/**
 * GET /api/categories/size-guides
 * Retrieve all size guides
 */
router.get('/size-guides', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: sizeGuides,
    });
  } catch (error) {
    console.error('Error fetching size guides:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve size guides.',
    });
  }
});

/**
 * PUT /api/categories/size-guides/:category
 * Update size guide for a specific category (Admin only)
 */
router.put('/size-guides/:category', requireAuth, requireAdmin, (req, res) => {
  try {
    const { category } = req.params;
    const { measurements } = req.body;

    const existingIndex = sizeGuides.findIndex(sg => sg.category.toLowerCase() === category.toLowerCase());

    const updatedGuide = {
      category: category.toLowerCase(),
      measurements: typeof measurements === 'string' ? measurements : JSON.stringify(measurements || []),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      sizeGuides[existingIndex] = updatedGuide;
    } else {
      sizeGuides.push(updatedGuide);
    }

    return res.status(200).json({
      success: true,
      message: `Size guide for '${category}' updated.`,
      data: updatedGuide,
    });
  } catch (error) {
    console.error('Error updating size guide:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update size guide.',
    });
  }
});

export default router;

