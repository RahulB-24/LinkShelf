const express = require('express');
const { body, query: queryValidator, param } = require('express-validator');
const { query, getClient } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// GET /api/bookmarks - List bookmarks with search/filter
// ============================================================
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { search, tags, collection, sort = 'date-desc', limit = 50, offset = 0 } = req.query;

        let queryText = `
      SELECT 
        b.id,
        b.url,
        b.title,
        b.description,
        b.favicon_url,
        b.notes,
        b.collection_id,
        b.visit_count,
        b.last_visited_at,
        b.created_at,
        b.updated_at,
        c.name as collection_name,
        COALESCE(
          array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          ARRAY[]::text[]
        ) as tags
    `;

        const params = [userId];
        let paramIndex = 2;

        // Add ranking for search
        if (search) {
            const searchTerms = search.trim().split(/\s+/)
                .filter(w => w.length > 2)
                .map(w => w + ':*')
                .join(' & ');

            if (searchTerms) {
                queryText += `, ts_rank(b.search_vector, to_tsquery('english', $${paramIndex})) as rank`;
                params.push(searchTerms);
                paramIndex++;
            }
        }

        queryText += `
      FROM bookmarks b
      LEFT JOIN collections c ON b.collection_id = c.id
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.user_id = $1
    `;

        // Enhanced search filter - searches title, description, notes, tags, collection names, and dates
        if (search && params.length > 1) {
            // Build comprehensive search condition
            const searchLower = search.toLowerCase().trim();

            // Parse potential date patterns from search
            const dateConditions = [];
            const months = {
                'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
                'jul': 7, 'july': 7, 'aug': 8, 'august': 8, 'sep': 9, 'september': 9,
                'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
            };

            // Try to parse date-like patterns
            for (const [monthName, monthNum] of Object.entries(months)) {
                if (searchLower.includes(monthName)) {
                    dateConditions.push(`EXTRACT(MONTH FROM b.created_at) = ${monthNum}`);
                }
            }

            // Check for day numbers (1-31)
            const dayMatch = searchLower.match(/\b([0-9]{1,2})\b/);
            if (dayMatch) {
                const day = parseInt(dayMatch[1]);
                if (day >= 1 && day <= 31) {
                    dateConditions.push(`EXTRACT(DAY FROM b.created_at) = ${day}`);
                }
            }

            // Check for year (2020-2030)
            const yearMatch = searchLower.match(/\b(20[2-3][0-9])\b/);
            if (yearMatch) {
                dateConditions.push(`EXTRACT(YEAR FROM b.created_at) = ${yearMatch[1]}`);
            }

            // Check for dd/mm or mm/dd patterns
            const dateSlashMatch = searchLower.match(/(\d{1,2})[\/\-](\d{1,2})/);
            if (dateSlashMatch) {
                const num1 = parseInt(dateSlashMatch[1]);
                const num2 = parseInt(dateSlashMatch[2]);
                // Assume day/month format
                if (num1 >= 1 && num1 <= 31) {
                    dateConditions.push(`EXTRACT(DAY FROM b.created_at) = ${num1}`);
                }
                if (num2 >= 1 && num2 <= 12) {
                    dateConditions.push(`EXTRACT(MONTH FROM b.created_at) = ${num2}`);
                }
            }

            // Build the search condition
            let searchCondition = `(
                b.search_vector @@ to_tsquery('english', $2)
                OR LOWER(c.name) LIKE $${paramIndex}
                OR b.id IN (
                    SELECT bt3.bookmark_id FROM bookmark_tags bt3 
                    JOIN tags t3 ON bt3.tag_id = t3.id 
                    WHERE LOWER(t3.name) LIKE $${paramIndex}
                )`;

            // Add date conditions if any were found
            if (dateConditions.length > 0) {
                searchCondition += ` OR (${dateConditions.join(' AND ')})`;
            }

            searchCondition += `)`;

            queryText += ` AND ${searchCondition}`;
            params.push(`%${searchLower}%`);
            paramIndex++;
        }

        // Collection filter
        if (collection) {
            queryText += ` AND b.collection_id = $${paramIndex}`;
            params.push(collection);
            paramIndex++;
        }

        // Tag filter
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            queryText += ` AND b.id IN (
        SELECT bt2.bookmark_id 
        FROM bookmark_tags bt2 
        JOIN tags t2 ON bt2.tag_id = t2.id 
        WHERE t2.name = ANY($${paramIndex}::text[])
      )`;
            params.push(tagArray);
            paramIndex++;
        }

        queryText += ` GROUP BY b.id, c.id, c.name`;

        // Sorting
        switch (sort) {
            case 'date-asc':
                queryText += ` ORDER BY b.created_at ASC`;
                break;
            case 'alpha-asc':
                queryText += ` ORDER BY b.title ASC`;
                break;
            case 'alpha-desc':
                queryText += ` ORDER BY b.title DESC`;
                break;
            case 'visited':
                queryText += ` ORDER BY b.visit_count DESC, b.created_at DESC`;
                break;
            default:
                if (search) {
                    queryText += ` ORDER BY rank DESC, b.created_at DESC`;
                } else {
                    queryText += ` ORDER BY b.created_at DESC`;
                }
        }

        queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, params);

        // Get total count for pagination
        const countResult = await query(
            'SELECT COUNT(*) FROM bookmarks WHERE user_id = $1',
            [userId]
        );

        res.json({
            bookmarks: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /api/bookmarks - Create bookmark
// ============================================================
router.post('/', [
    body('url').isURL().withMessage('Valid URL is required'),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('notes').optional().trim(),
    body('collectionId').optional({ nullable: true }).custom((value) => {
        // Allow null, undefined, empty string, or valid integer
        if (value === null || value === undefined || value === '' || Number.isInteger(Number(value))) {
            return true;
        }
        throw new Error('Invalid collection ID');
    }),
    body('tags').optional().isArray(),
    validate
], async (req, res, next) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { url, title, description, notes, collectionId, tags = [], faviconUrl } = req.body;

        await client.query('BEGIN');

        // Check for duplicate
        const existing = await client.query(
            'SELECT id, title, created_at FROM bookmarks WHERE user_id = $1 AND url = $2',
            [userId, url]
        );

        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Duplicate URL',
                existing: existing.rows[0]
            });
        }

        // Insert bookmark with favicon
        const bookmarkResult = await client.query(
            `INSERT INTO bookmarks (user_id, url, title, description, notes, collection_id, favicon_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [userId, url, title || url, description, notes, collectionId || null, faviconUrl || null]
        );

        const bookmark = bookmarkResult.rows[0];

        // Process tags
        const insertedTags = [];
        for (const tagName of tags) {
            const trimmedTag = tagName.trim().toLowerCase();
            if (!trimmedTag) continue;

            // Upsert tag
            const tagResult = await client.query(
                `INSERT INTO tags (user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
                [userId, trimmedTag]
            );

            const tagId = tagResult.rows[0].id;
            insertedTags.push(tagResult.rows[0].name);

            // Create bookmark-tag relationship
            await client.query(
                `INSERT INTO bookmark_tags (bookmark_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
                [bookmark.id, tagId]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            ...bookmark,
            tags: insertedTags
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

// ============================================================
// POST /api/bookmarks/scrape - Fetch URL metadata
// ============================================================
router.post('/scrape', [
    body('url').isURL().withMessage('Valid URL is required'),
    validate
], async (req, res, next) => {
    try {
        const { scrapeMetadata } = require('../services/scraper');
        const { url } = req.body;

        // Check for duplicate first
        const existing = await query(
            'SELECT id, title, created_at FROM bookmarks WHERE user_id = $1 AND url = $2',
            [req.user.id, url]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: 'Duplicate URL',
                existing: existing.rows[0]
            });
        }

        const metadata = await scrapeMetadata(url);
        res.json(metadata);

    } catch (error) {
        next(error);
    }
});

// ============================================================
// GET /api/bookmarks/:id - Get single bookmark
// ============================================================
router.get('/:id', [
    param('id').isInt().withMessage('Valid bookmark ID required'),
    validate
], async (req, res, next) => {
    try {
        const result = await query(
            `SELECT 
        b.*,
        c.name as collection_name,
        COALESCE(
          array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          ARRAY[]::text[]
        ) as tags
      FROM bookmarks b
      LEFT JOIN collections c ON b.collection_id = c.id
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = $1 AND b.user_id = $2
      GROUP BY b.id, c.id, c.name`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

// ============================================================
// PUT /api/bookmarks/:id - Update bookmark
// ============================================================
router.put('/:id', [
    param('id').isInt().withMessage('Valid bookmark ID required'),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('notes').optional().trim(),
    body('collectionId').optional(),
    body('tags').optional().isArray(),
    validate
], async (req, res, next) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const bookmarkId = req.params.id;
        const { title, description, notes, collectionId, tags } = req.body;

        await client.query('BEGIN');

        // Check ownership
        const existing = await client.query(
            'SELECT id FROM bookmarks WHERE id = $1 AND user_id = $2',
            [bookmarkId, userId]
        );

        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        // Update bookmark
        const updateResult = await client.query(
            `UPDATE bookmarks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           notes = COALESCE($3, notes),
           collection_id = $4,
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
            [title, description, notes, collectionId || null, bookmarkId, userId]
        );

        // Update tags if provided
        if (tags !== undefined) {
            // Remove existing tags
            await client.query(
                'DELETE FROM bookmark_tags WHERE bookmark_id = $1',
                [bookmarkId]
            );

            // Add new tags
            const insertedTags = [];
            for (const tagName of tags) {
                const trimmedTag = tagName.trim().toLowerCase();
                if (!trimmedTag) continue;

                const tagResult = await client.query(
                    `INSERT INTO tags (user_id, name)
           VALUES ($1, $2)
           ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, name`,
                    [userId, trimmedTag]
                );

                insertedTags.push(tagResult.rows[0].name);

                await client.query(
                    `INSERT INTO bookmark_tags (bookmark_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
                    [bookmarkId, tagResult.rows[0].id]
                );
            }
        }

        await client.query('COMMIT');

        // Fetch updated bookmark with tags
        const result = await query(
            `SELECT 
        b.*,
        c.name as collection_name,
        COALESCE(
          array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          ARRAY[]::text[]
        ) as tags
      FROM bookmarks b
      LEFT JOIN collections c ON b.collection_id = c.id
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = $1
      GROUP BY b.id, c.id, c.name`,
            [bookmarkId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

// ============================================================
// DELETE /api/bookmarks/:id - Delete bookmark
// ============================================================
router.delete('/:id', [
    param('id').isInt().withMessage('Valid bookmark ID required'),
    validate
], async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        res.json({ message: 'Bookmark deleted', id: result.rows[0].id });

    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /api/bookmarks/:id/visit - Track visit
// ============================================================
router.post('/:id/visit', [
    param('id').isInt().withMessage('Valid bookmark ID required'),
    validate
], async (req, res, next) => {
    try {
        const result = await query(
            `UPDATE bookmarks 
       SET visit_count = visit_count + 1, last_visited_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, visit_count, last_visited_at`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
