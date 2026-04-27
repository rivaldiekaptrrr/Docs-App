const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRND } = require('../middleware/auth');

// Middleware to check project access for documentation
const checkDocumentationAccess = async (req, res, next) => {
    try {
        const docId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin has access to everything
        if (userRole === 'Admin') {
            req.hasDocAccess = true;
            return next();
        }

        // Get project_id from documentation
        const docResult = await db.query('SELECT project_id FROM documentation WHERE id = $1', [docId]);

        if (docResult.rows.length === 0) {
            return res.status(404).json({ error: 'Documentation not found' });
        }

        const projectId = docResult.rows[0].project_id;

        // Check if user is a member of the project
        const memberCheck = await db.query(
            'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        req.hasDocAccess = memberCheck.rows.length > 0;
        req.projectId = projectId;
        next();
    } catch (error) {
        console.error('Check documentation access error:', error);
        res.status(500).json({ error: 'Failed to check documentation access' });
    }
};

// Middleware to check project access by project_id
const checkProjectAccessByProjectId = async (req, res, next) => {
    try {
        const projectId = req.body.project_id || req.params.projectId;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin has access to everything
        if (userRole === 'Admin') {
            req.hasProjectAccess = true;
            return next();
        }

        // Check if user is a member of the project
        const memberCheck = await db.query(
            'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );

        req.hasProjectAccess = memberCheck.rows.length > 0;
        next();
    } catch (error) {
        console.error('Check project access error:', error);
        res.status(500).json({ error: 'Failed to check project access' });
    }
};

// Get documentation for a project
router.get('/project/:projectId', requireAuth, async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await db.query(
            `SELECT d.*, u.full_name as author_name
       FROM documentation d
       LEFT JOIN users u ON d.author_id = u.id
       WHERE d.project_id = $1
       ORDER BY d.created_at DESC`,
            [projectId]
        );

        res.json({ documentation: result.rows });
    } catch (error) {
        console.error('Get documentation error:', error);
        res.status(500).json({ error: 'Failed to fetch documentation' });
    }
});

// Get single documentation
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT d.*, u.full_name as author_name, p.name as project_name
       FROM documentation d
       LEFT JOIN users u ON d.author_id = u.id
       LEFT JOIN projects p ON d.project_id = p.id
       WHERE d.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documentation not found' });
        }

        // Increment view count
        await db.query('UPDATE documentation SET views = views + 1 WHERE id = $1', [id]);

        res.json({ documentation: result.rows[0] });
    } catch (error) {
        console.error('Get documentation error:', error);
        res.status(500).json({ error: 'Failed to fetch documentation' });
    }
});

// Create documentation (R&D only + project member)
router.post('/', requireAuth, requireRND, checkProjectAccessByProjectId, async (req, res) => {
    try {
        const { project_id, title, content } = req.body;

        if (!project_id || !title || !content) {
            return res.status(400).json({ error: 'Project ID, title, and content required' });
        }

        // Check access
        if (!req.hasProjectAccess) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const result = await db.query(
            `INSERT INTO documentation (project_id, title, content, author_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [project_id, title, content, req.user.id]
        );

        // Update project updated_at
        await db.query('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [project_id]);

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'create', 'documentation', result.rows[0].id, JSON.stringify({ project_id, title })]
        );

        res.status(201).json({ documentation: result.rows[0] });
    } catch (error) {
        console.error('Create documentation error:', error);
        res.status(500).json({ error: 'Failed to create documentation' });
    }
});

// Update documentation (R&D only + project member)
router.put('/:id', requireAuth, requireRND, checkDocumentationAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        // Check access
        if (!req.hasDocAccess) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const result = await db.query(
            `UPDATE documentation 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
            [title, content, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documentation not found' });
        }

        // Update project updated_at
        await db.query('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].project_id]);

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'update', 'documentation', id]
        );

        res.json({ documentation: result.rows[0] });
    } catch (error) {
        console.error('Update documentation error:', error);
        res.status(500).json({ error: 'Failed to update documentation' });
    }
});

// Delete documentation (R&D only + project member)
router.delete('/:id', requireAuth, requireRND, checkDocumentationAccess, async (req, res) => {
    try {
        const { id } = req.params;

        // Check access
        if (!req.hasDocAccess) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const result = await db.query('DELETE FROM documentation WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documentation not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'delete', 'documentation', id]
        );

        res.json({ message: 'Documentation deleted successfully' });
    } catch (error) {
        console.error('Delete documentation error:', error);
        res.status(500).json({ error: 'Failed to delete documentation' });
    }
});

module.exports = router;
