const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { search, role, status } = req.query;

        let query = 'SELECT id, username, full_name, email, role, status, created_at, last_login FROM users WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (username ILIKE $${paramCount} OR full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (role) {
            paramCount++;
            query += ` AND role = $${paramCount}`;
            params.push(role);
        }

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user (Admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT id, username, full_name, email, role, status, created_at, last_login FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create new user (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { username, password, full_name, email, role, status = 'Active' } = req.body;

        // Validate required fields
        if (!username || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Username, password, full name, and role are required' });
        }

        // Check if username already exists
        const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.query(
            `INSERT INTO users (username, password_hash, full_name, email, role, status) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, username, full_name, email, role, status, created_at`,
            [username, password_hash, full_name, email, role, status]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE_USER', 'user', result.rows[0].id, JSON.stringify({ username, role })]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, status } = req.body;

        // Prevent admin from downgrading themselves
        if (parseInt(id) === req.user.id && role && role !== 'Admin') {
            return res.status(400).json({ error: 'Cannot change your own admin role' });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramIdx = 0;

        if ('full_name' in req.body) { paramIdx++; updates.push(`full_name = $${paramIdx}`); values.push(full_name); }
        if ('email' in req.body) { paramIdx++; updates.push(`email = $${paramIdx}`); values.push(email); }
        if ('role' in req.body) { paramIdx++; updates.push(`role = $${paramIdx}`); values.push(role); }
        if ('status' in req.body) { paramIdx++; updates.push(`status = $${paramIdx}`); values.push(status); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        paramIdx++;
        values.push(id);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} 
             RETURNING id, username, full_name, email, role, status, created_at`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'UPDATE_USER', 'user', id]
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'DELETE_USER', 'user', id, JSON.stringify({ username: result.rows[0].username })]
        );

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Reset user password (Admin only)
router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        const result = await db.query(
            'UPDATE users SET password_hash = $1, must_change_password = true, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING username',
            [password_hash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'RESET_PASSWORD', 'user', id]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
