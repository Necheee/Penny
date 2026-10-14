import express from 'express';
import { initialCategories, initialSizeGuides } from '../data/initialCatalogue.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';
import { getPool } from '../utils/cloudDb.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Active persistent storage for categories and size guides
let categories = readJsonFile('categories.json', initialCategories) || initialCategories;
let sizeGuides = readJsonFile('sizeGuides.json', initialSizeGuides) || initialSizeGuides;

/**
 * GET /api/categories
 * Retrieve all active product categories
 */
router.get('/', async (req, res) => {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100)
        );
      `);
      const dbRes = await pool.query('SELECT * FROM categories');
      if (dbRes.rows && dbRes.rows.length > 0) {
        const map = new Map();
        categories.forEach(c => map.set(c.id, c));
        dbRes.rows.forEach(r => map.set(r.id, { id: r.id, name: r.name, slug: r.slug || r.id }));
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
    const { name, slug } = req.body;

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

    const newCategory = {
      id: newId,
      name: trimmedName,
      slug: generatedSlug,
      displayOrder: categories.length + 1,
    };

    categories.push(newCategory);
    writeJsonFile('categories.json', categories);

    try {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100)
          );
          INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
        `, [newCategory.id, newCategory.name, newCategory.slug]);
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

