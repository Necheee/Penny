import express from 'express';
import { initialSizeGuides } from '../data/initialCatalogue.js';
import { readJsonFile, writeJsonFile } from '../utils/persistentStorage.js';
import { getPool } from '../utils/cloudDb.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

let sizeGuides = (readJsonFile('sizeGuides.json', initialSizeGuides) || initialSizeGuides)
  .filter(sg => sg.category !== 'sets' && sg.category !== 'tops' && sg.category !== 'bottoms');

const hasDatabase = () => Boolean(process.env.DATABASE_URL?.startsWith('postgres'));

function requireDatabase(res) {
  if (hasDatabase()) return true;
  res.status(503).json({
    success: false,
    message: 'Category operations require the PostgreSQL database.',
  });
  return false;
}

function formatCategoryRow(row) {
  let subcategories = row.subcategories;
  if (typeof subcategories === 'string') {
    try { subcategories = JSON.parse(subcategories); } catch { subcategories = []; }
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.id,
    displayOrder: row.display_order || 1,
    subcategories: Array.isArray(subcategories) ? subcategories : [],
  };
}

async function findCategory(pool, id) {
  const result = await pool.query(
    "SELECT * FROM categories WHERE (id = $1 OR slug = $1) AND id != 'sets' AND slug != 'two-piece-sets' LIMIT 1",
    [id],
  );
  return result.rows[0] ? formatCategoryRow(result.rows[0]) : null;
}

const getSubName = (subcategory) => (
  typeof subcategory === 'string' ? subcategory : subcategory?.name || ''
).trim();

/**
 * GET /api/categories
 * Retrieve all active product categories with their subcategories
 */
router.get('/', async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const pool = getPool();
    await pool.query("DELETE FROM categories WHERE id = 'sets' OR slug = 'two-piece-sets'");
    const dbRes = await pool.query(
      "SELECT * FROM categories WHERE id != 'sets' AND slug != 'two-piece-sets' ORDER BY display_order ASC",
    );
    const categories = dbRes.rows.map(formatCategoryRow);

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    console.error('[CATEGORIES] Database read failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Failed to retrieve categories from the database.',
    });
  }
});

/**
 * POST /api/categories
 * Add a new category.
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
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
    const pool = getPool();

    const duplicate = await pool.query(
      'SELECT 1 FROM categories WHERE id = $1 OR slug = $1 LIMIT 1',
      [generatedSlug],
    );
    if (duplicate.rows.length > 0) {
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

    const nextOrder = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM categories',
    );
    const result = await pool.query(`
      INSERT INTO categories (id, name, slug, display_order, subcategories)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      newId,
      trimmedName,
      generatedSlug,
      Number(nextOrder.rows[0].next_order),
      JSON.stringify(parsedSubs),
    ]);
    const newCategory = formatCategoryRow(result.rows[0]);

    return res.status(201).json({
      success: true,
      message: 'Category added successfully.',
      data: newCategory,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database create failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Category could not be saved to the database.',
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update an existing category (name, slug, displayOrder, subcategories)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    const { name, slug, displayOrder, subcategories: rawSubs } = req.body;
    const pool = getPool();

    const category = await findCategory(pool, id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    if (name && typeof name === 'string') category.name = name.trim();
    if (slug && typeof slug === 'string') category.slug = slug.trim();
    if (typeof displayOrder === 'number') category.displayOrder = displayOrder;

    if (Array.isArray(rawSubs)) {
      category.subcategories = rawSubs.map(sub => {
        if (typeof sub === 'string') {
          return { name: sub.trim(), subtypes: [] };
        } else if (typeof sub === 'object' && sub !== null) {
          return {
            name: (sub.name || '').trim(),
            subtypes: Array.isArray(sub.subtypes) ? sub.subtypes.map(s => String(s).trim()).filter(Boolean) : []
          };
        }
        return { name: String(sub).trim(), subtypes: [] };
      }).filter(s => s.name);
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, slug = $2, display_order = $3, subcategories = $4
       WHERE id = $5
       RETURNING *`,
      [
        category.name,
        category.slug || category.id,
        category.displayOrder || 1,
        JSON.stringify(category.subcategories),
        category.id,
      ],
    );
    const updatedCategory = formatCategoryRow(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: `Category '${updatedCategory.name}' updated successfully.`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database update failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Category could not be updated in the database.',
    });
  }
});

/**
 * POST /api/categories/:id/subcategories
 * Add a subcategory to an existing category
 */
router.post('/:id/subcategories', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    const subcategoryName = (req.body.subcategory || req.body.name || '').trim();
    const rawSubtypes = req.body.subtypes || [];

    if (!subcategoryName) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory name is required.',
      });
    }

    const pool = getPool();
    const category = await findCategory(pool, id);
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
    const exists = category.subcategories.some(s => getSubName(s).toLowerCase() === subcategoryName.toLowerCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Subcategory '${subcategoryName}' already exists in ${category.name}.`,
      });
    }

    const newSubObj = {
      name: subcategoryName,
      subtypes: Array.isArray(rawSubtypes) ? rawSubtypes.map(s => String(s).trim()).filter(Boolean) : []
    };

    category.subcategories.push(newSubObj);
    const result = await pool.query(
      'UPDATE categories SET subcategories = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(category.subcategories), category.id],
    );
    const updatedCategory = formatCategoryRow(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: `Subcategory '${subcategoryName}' added to ${updatedCategory.name}.`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database subcategory add failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Subcategory could not be saved to the database.',
    });
  }
});

/**
 * PUT /api/categories/:id/subcategories/:subName
 * Update a subcategory name or its subtypes
 */
router.put('/:id/subcategories/:subName', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id, subName } = req.params;
    const { newName, subtypes } = req.body;
    const targetSub = decodeURIComponent(subName).trim().toLowerCase();
    const pool = getPool();

    const category = await findCategory(pool, id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    const subIndex = category.subcategories.findIndex(s => getSubName(s).toLowerCase() === targetSub);
    if (subIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Subcategory '${subName}' not found in ${category.name}.`,
      });
    }

    const currentSub = category.subcategories[subIndex];
    const updatedSub = {
      name: (newName && typeof newName === 'string') ? newName.trim() : getSubName(currentSub),
      subtypes: Array.isArray(subtypes) 
        ? subtypes.map(s => String(s).trim()).filter(Boolean)
        : (typeof currentSub === 'object' && Array.isArray(currentSub.subtypes) ? currentSub.subtypes : [])
    };

    category.subcategories[subIndex] = updatedSub;
    const result = await pool.query(
      'UPDATE categories SET subcategories = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(category.subcategories), category.id],
    );
    const updatedCategory = formatCategoryRow(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: `Subcategory updated in ${updatedCategory.name}.`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database subcategory update failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Subcategory could not be updated in the database.',
    });
  }
});

/**
 * DELETE /api/categories/:id/subcategories/:subName
 * Remove a subcategory from an existing category
 */
router.delete('/:id/subcategories/:subName', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id, subName } = req.params;
    const targetSub = decodeURIComponent(subName).trim().toLowerCase();
    const pool = getPool();

    const category = await findCategory(pool, id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }

    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    category.subcategories = category.subcategories.filter(s => getSubName(s).toLowerCase() !== targetSub);
    const result = await pool.query(
      'UPDATE categories SET subcategories = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(category.subcategories), category.id],
    );
    const updatedCategory = formatCategoryRow(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: `Subcategory '${subName}' removed from ${updatedCategory.name}.`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database subcategory delete failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Subcategory could not be deleted from the database.',
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Remove a category permanently
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 OR slug = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${id}' not found.`,
      });
    }
    const removed = formatCategoryRow(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: 'Category removed successfully.',
      data: removed,
    });
  } catch (error) {
    console.error('[CATEGORIES] Database delete failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Category could not be deleted from the database.',
    });
  }
});

/**
 * GET /api/categories/presets/all
 * Retrieve custom garment presets
 */
router.get('/presets/all', (req, res) => {
  const presets = readJsonFile('presets.json', {}) || {};
  return res.status(200).json({
    success: true,
    data: presets
  });
});

/**
 * POST /api/categories/presets/all
 * Save updated garment presets
 */
router.post('/presets/all', requireAuth, requireAdmin, (req, res) => {
  const updatedPresets = req.body || {};
  writeJsonFile('presets.json', updatedPresets);
  return res.status(200).json({
    success: true,
    message: 'Garment presets saved successfully.',
    data: updatedPresets
  });
});

/**
 * GET /api/categories/announcements
 * Retrieve announcement bar messages from Neon Cloud DB or local cache
 */
router.get('/announcements', async (req, res) => {
  try {
    let list = [
      "Enjoy free shipping on orders above ₦200,000",
      "Lagos delivery in 1 to 3 days",
      "Pieces designed to work perfectly together"
    ];
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const pool = getPool();
      const resDb = await pool.query('SELECT messages FROM announcements WHERE id = 1');
      if (resDb.rows.length > 0 && Array.isArray(resDb.rows[0].messages)) {
        list = resDb.rows[0].messages;
      }
    } else {
      list = readJsonFile('announcements.json', list);
    }
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(200).json({
      success: true,
      data: [
        "Enjoy free shipping on orders above ₦200,000",
        "Lagos delivery in 1 to 3 days",
        "Pieces designed to work perfectly together"
      ]
    });
  }
});

/**
 * POST /api/categories/announcements
 * Save announcement bar messages to Neon Cloud DB (Admin only)
 */
router.post('/announcements', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { messages } = req.body;
    if (Array.isArray(messages)) {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        const pool = getPool();
        await pool.query(`
          INSERT INTO announcements (id, messages, updated_at)
          VALUES (1, $1, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET messages = EXCLUDED.messages, updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify(messages)]);
      }
      writeJsonFile('announcements.json', messages);
    }
    return res.status(200).json({ success: true, message: 'Announcements saved.', data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to save announcements.' });
  }
});

/**
 * GET /api/categories/size-guides
 * Retrieve all size guides
 */
router.get('/size-guides', async (req, res) => {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const p = getPool();
      const dbRes = await p.query('SELECT category, title, subtitle, columns, rows, updated_at FROM size_guides ORDER BY category ASC');
      if (dbRes.rows && dbRes.rows.length > 0) {
        return res.status(200).json({
          success: true,
          data: dbRes.rows,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: sizeGuides,
    });
  } catch (error) {
    console.error('Error fetching size guides:', error);
    return res.status(200).json({
      success: true,
      data: sizeGuides,
    });
  }
});

/**
 * PUT /api/categories/size-guides/:category
 * Update size guide for a specific category (Admin only)
 */
router.put('/size-guides/:category', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const { title, subtitle, columns, rows, measurements } = req.body;

    const catKey = category.toLowerCase();
    const updatedTitle = title || (catKey.charAt(0).toUpperCase() + catKey.slice(1));
    const updatedSubtitle = subtitle || '';
    const updatedColumns = Array.isArray(columns) ? columns : [];
    const updatedRows = Array.isArray(rows) 
      ? rows 
      : (Array.isArray(measurements) 
          ? measurements 
          : (typeof measurements === 'string' ? JSON.parse(measurements || '[]') : []));

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      const p = getPool();
      await p.query(`
        INSERT INTO size_guides (category, title, subtitle, columns, rows, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (category) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          columns = EXCLUDED.columns,
          rows = EXCLUDED.rows,
          updated_at = CURRENT_TIMESTAMP
      `, [
        catKey,
        updatedTitle,
        updatedSubtitle,
        JSON.stringify(updatedColumns),
        JSON.stringify(updatedRows)
      ]);
    }

    const updatedGuide = {
      category: catKey,
      title: updatedTitle,
      subtitle: updatedSubtitle,
      columns: updatedColumns,
      rows: updatedRows,
      measurements: JSON.stringify(updatedRows),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = sizeGuides.findIndex(sg => sg.category.toLowerCase() === catKey);
    if (existingIndex >= 0) {
      sizeGuides[existingIndex] = updatedGuide;
    } else {
      sizeGuides.push(updatedGuide);
    }
    writeJsonFile('sizeGuides.json', sizeGuides);

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

