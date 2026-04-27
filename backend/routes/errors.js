const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { requireAuth, requireRND } = require('../middleware/auth');

const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

// Get all error reports (with filters)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status, severity, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT e.*, 
             u1.full_name as reporter_name,
             u2.full_name as solver_name
      FROM error_reports e
      LEFT JOIN users u1 ON e.reported_by = u1.id
      LEFT JOIN users u2 ON e.solved_by = u2.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND e.status = $${paramCount}`;
            params.push(status);
        }

        if (severity) {
            paramCount++;
            query += ` AND e.severity = $${paramCount}`;
            params.push(severity);
        }

        query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count with same filters
        let countQuery = 'SELECT COUNT(*) FROM error_reports e WHERE 1=1';
        const countParams = [];
        let countIdx = 0;
        if (status) { countIdx++; countQuery += ` AND e.status = $${countIdx}`; countParams.push(status); }
        if (severity) { countIdx++; countQuery += ` AND e.severity = $${countIdx}`; countParams.push(severity); }
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            errors: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get error reports error:', error);
        res.status(500).json({ error: 'Failed to fetch error reports' });
    }
});

// Get single error report
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT e.*, 
              u1.full_name as reporter_name,
              u2.full_name as solver_name
       FROM error_reports e
       LEFT JOIN users u1 ON e.reported_by = u1.id
       LEFT JOIN users u2 ON e.solved_by = u2.id
       WHERE e.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Error report not found' });
        }

        res.json({ error: result.rows[0] });
    } catch (error) {
        console.error('Get error report error:', error);
        res.status(500).json({ error: 'Failed to fetch error report' });
    }
});

// Create error report (R&D only)
router.post('/', requireAuth, requireRND, async (req, res) => {
    try {
        const { title, description, severity, before_images, after_images, solution, created_at } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description required' });
        }

        const result = await db.query(
            `INSERT INTO error_reports (title, description, severity, before_images, after_images, solution, reported_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                title,
                description,
                severity || 'Medium',
                JSON.stringify(before_images || []),
                JSON.stringify(after_images || []),
                solution || null,
                req.user.id,
                created_at || new Date()
            ]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE_ERROR_REPORT', 'error_report', result.rows[0].id, JSON.stringify({ title })]
        );

        res.status(201).json({ error: result.rows[0] });
    } catch (error) {
        console.error('Create error report error:', error);
        res.status(500).json({ error: 'Failed to create error report' });
    }
});

// Update error report (R&D only)
router.put('/:id', requireAuth, requireRND, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, severity, before_images, after_images, solution, created_at } = req.body;

        // Check which fields were explicitly sent in the request body
        const updates = [];
        const values = [];
        let paramIdx = 0;

        // Only update fields that are explicitly present in the request body
        if ('title' in req.body) { paramIdx++; updates.push(`title = $${paramIdx}`); values.push(title); }
        if ('description' in req.body) { paramIdx++; updates.push(`description = $${paramIdx}`); values.push(description); }
        if ('severity' in req.body) { paramIdx++; updates.push(`severity = $${paramIdx}`); values.push(severity); }
        if ('before_images' in req.body) { paramIdx++; updates.push(`before_images = $${paramIdx}`); values.push(JSON.stringify(before_images || [])); }
        if ('after_images' in req.body) { paramIdx++; updates.push(`after_images = $${paramIdx}`); values.push(JSON.stringify(after_images || [])); }
        if ('solution' in req.body) { paramIdx++; updates.push(`solution = $${paramIdx}`); values.push(solution || null); }
        if ('created_at' in req.body) { paramIdx++; updates.push(`created_at = $${paramIdx}`); values.push(created_at); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        paramIdx++;
        values.push(id);

        const result = await db.query(
            `UPDATE error_reports SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Error report not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'UPDATE_ERROR_REPORT', 'error_report', id]
        );

        res.json({ error: result.rows[0] });
    } catch (error) {
        console.error('Update error report error:', error);
        res.status(500).json({ error: 'Failed to update error report' });
    }
});

// Update error status (R&D only)
router.patch('/:id/status', requireAuth, requireRND, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['Pending', 'In Progress', 'Solved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = {
            status,
            solved_by: status === 'Solved' ? req.user.id : null,
            resolved_at: status === 'Solved' ? new Date() : null
        };

        const result = await db.query(
            `UPDATE error_reports 
       SET status = $1,
           solved_by = $2,
           resolved_at = $3
       WHERE id = $4
       RETURNING *`,
            [updateData.status, updateData.solved_by, updateData.resolved_at, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Error report not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CHANGE_STATUS', 'error_report', id, JSON.stringify({ status })]
        );

        res.json({ error: result.rows[0] });
    } catch (error) {
        console.error('Update error status error:', error);
        res.status(500).json({ error: 'Failed to update error status' });
    }
});

// Delete error report (R&D only)
router.delete('/:id', requireAuth, requireRND, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the error report first to get image paths
        const existing = await db.query('SELECT before_images, after_images FROM error_reports WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Error report not found' });
        }

        const result = await db.query('DELETE FROM error_reports WHERE id = $1 RETURNING *', [id]);

        // Cleanup associated image files from disk
        const row = existing.rows[0];
        const allImages = [];
        try {
            const before = typeof row.before_images === 'string' ? JSON.parse(row.before_images) : (row.before_images || []);
            const after = typeof row.after_images === 'string' ? JSON.parse(row.after_images) : (row.after_images || []);
            allImages.push(...before, ...after);
        } catch (e) { /* ignore parse errors */ }

        for (const img of allImages) {
            if (img && img.url) {
                // img.url is like /uploads/errors/filename.png
                const filePath = path.join(UPLOAD_BASE, img.url.replace('/uploads/', ''));
                try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* best effort */ }
            }
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'DELETE_ERROR_REPORT', 'error_report', id]
        );

        res.json({ message: 'Error report deleted successfully' });
    } catch (error) {
        console.error('Delete error report error:', error);
        res.status(500).json({ error: 'Failed to delete error report' });
    }
});

module.exports = router;
