import express from 'express';
import { initialCategories, initialSizeGuides } from '../data/initialCatalogue.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Active cache for categories and size guides
let categories = [...initialCategories];
let sizeGuides = [...initialSizeGuides];

/**
 * GET /api/categories
 * Retrieve all active product categories
 */
router.get('/', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories.',
    });
  }
});

/**
 * POST /api/categories
 * Add a new category (Admin only)
 */
router.post('/', requireAuth, requireAdmin, (req, res) => {
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
 * Remove a category (Admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
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
