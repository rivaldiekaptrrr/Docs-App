const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get project members
router.get('/:projectId/members', requireAuth, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if project exists
        const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get members with user details
        const result = await query(`
            SELECT 
                pm.id,
                pm.user_id,
                pm.role,
                pm.created_at,
                u.username,
                u.full_name,
                u.email,
                u.role as user_role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1
            ORDER BY 
                CASE pm.role 
                    WHEN 'owner' THEN 1 
                    WHEN 'editor' THEN 2 
                    ELSE 3 
                END,
                pm.created_at ASC
        `, [projectId]);

        res.json({ members: result.rows });
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ error: 'Failed to fetch project members' });
    }
});

// Add project member (Admin only)
router.post('/:projectId/members', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { user_id, role = 'editor' } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        // Validate role
        if (!['owner', 'editor', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be owner, editor, or viewer' });
        }

        // Check if project exists
        const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user exists
        const userCheck = await query('SELECT id, username, full_name FROM users WHERE id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add member
        const result = await query(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (project_id, user_id) 
            DO UPDATE SET role = EXCLUDED.role
            RETURNING *
        `, [projectId, user_id, role]);

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'add_member', 'project', projectId, JSON.stringify({ added_user: userCheck.rows[0].username, role })]
        );

        res.status(201).json({
            message: 'Member added successfully',
            member: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding project member:', error);
        res.status(500).json({ error: 'Failed to add project member' });
    }
});

// Remove project member (Admin only)
router.delete('/:projectId/members/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        // Get member info before deleting
        const memberCheck = await query(`
            SELECT pm.*, u.username 
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1 AND pm.user_id = $2
        `, [projectId, userId]);

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found in this project' });
        }

        // Delete member
        await query(
            'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'remove_member', 'project', projectId, JSON.stringify({ removed_user: memberCheck.rows[0].username })]
        );

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing project member:', error);
        res.status(500).json({ error: 'Failed to remove project member' });
    }
});

// Check if user has access to project
router.get('/:projectId/check-access', requireAuth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Admin has access to everything
        if (req.user.role === 'Admin') {
            return res.json({ hasAccess: true, role: 'admin', isAdmin: true });
        }

        // Check if user is a member
        const result = await query(
            'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        if (result.rows.length > 0) {
            return res.json({
                hasAccess: true,
                role: result.rows[0].role,
                isAdmin: false
            });
        }

        res.json({ hasAccess: false, role: null, isAdmin: false });
    } catch (error) {
        console.error('Error checking project access:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
});

module.exports = router;
