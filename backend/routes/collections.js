const express = require('express');
const { body, param } = require('express-validator');
const { query } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// GET /api/collections - List all collections with counts
// ============================================================
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.color,
        c.created_at,
        COUNT(b.id) as count
      FROM collections c
      LEFT JOIN bookmarks b ON c.id = b.collection_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.name ASC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /api/collections - Create collection
// ============================================================
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], async (req, res, next) => {
    try {
        const { name, description, color } = req.body;
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const result = await query(
            `INSERT INTO collections (user_id, name, slug, description, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [req.user.id, name, slug, description || null, color || '#3B82F6']
        );

        res.status(201).json({ ...result.rows[0], count: 0 });

    } catch (error) {
        next(error);
    }
});

// ============================================================
// PUT /api/collections/:id - Update collection
// ============================================================
router.put('/:id', [
    param('id').isInt().withMessage('Valid collection ID required'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    validate
], async (req, res, next) => {
    try {
        const { name, description, color } = req.body;
        const slug = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;

        const result = await query(
            `UPDATE collections 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           color = COALESCE($4, color),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
            [name, slug, description, color, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

// ============================================================
// DELETE /api/collections/:id - Delete collection
// ============================================================
router.delete('/:id', [
    param('id').isInt().withMessage('Valid collection ID required'),
    validate
], async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json({ message: 'Collection deleted', id: result.rows[0].id });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
