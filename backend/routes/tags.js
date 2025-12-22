const express = require('express');
const { query } = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// GET /api/tags - List all tags with counts
// ============================================================
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT 
        t.id,
        t.name,
        COUNT(bt.bookmark_id) as count
      FROM tags t
      LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE t.user_id = $1
      GROUP BY t.id, t.name
      HAVING COUNT(bt.bookmark_id) > 0
      ORDER BY count DESC, t.name ASC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
