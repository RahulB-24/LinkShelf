const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { query } = require('../config/db');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters'),
    validate
], async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password (10 salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
            [email, passwordHash, name || null]
        );

        const user = result.rows[0];

        // Generate JWT token (7 day expiry)
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login - Authenticate user
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
], async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await query(
            'SELECT id, email, name, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'No account found with this email. Please check your email or sign up.' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me - Get current user (verify token)
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, email, name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
