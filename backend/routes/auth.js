const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user from database
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token (expires in 8 hours)
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Update last login timestamp
        await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log login activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
            [user.id, 'LOGIN', req.ip, req.get('User-Agent')]
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

// Logout (client-side token deletion, but we log it)
router.post('/logout', requireAuth, async (req, res) => {
    try {
        // Log logout activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'LOGOUT', req.ip, req.get('User-Agent')]
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;
