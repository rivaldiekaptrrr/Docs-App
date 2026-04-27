const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { requireAuth, requireRND } = require('../middleware/auth');

const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

// Get logbook entries (with filters)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { date, month, year, author_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT l.*, u.full_name as author_name
      FROM logbook_entries l
      LEFT JOIN users u ON l.author_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (date) {
            paramCount++;
            query += ` AND l.date = $${paramCount}`;
            params.push(date);
        } else if (month && year) {
            paramCount++;
            query += ` AND EXTRACT(MONTH FROM l.date) = $${paramCount}`;
            params.push(month);
            paramCount++;
            query += ` AND EXTRACT(YEAR FROM l.date) = $${paramCount}`;
            params.push(year);
        } else if (year) {
            paramCount++;
            query += ` AND EXTRACT(YEAR FROM l.date) = $${paramCount}`;
            params.push(year);
        }

        if (author_id) {
            paramCount++;
            query += ` AND l.author_id = $${paramCount}`;
            params.push(author_id);
        }

        query += ` ORDER BY l.date DESC, l.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count with same filters
        let countQuery = 'SELECT COUNT(*) FROM logbook_entries l WHERE 1=1';
        const countParams = [];
        let countIdx = 0;
        if (date) {
            countIdx++; countQuery += ` AND l.date = $${countIdx}`; countParams.push(date);
        } else if (month && year) {
            countIdx++; countQuery += ` AND EXTRACT(MONTH FROM l.date) = $${countIdx}`; countParams.push(month);
            countIdx++; countQuery += ` AND EXTRACT(YEAR FROM l.date) = $${countIdx}`; countParams.push(year);
        } else if (year) {
            countIdx++; countQuery += ` AND EXTRACT(YEAR FROM l.date) = $${countIdx}`; countParams.push(year);
        }
        if (author_id) {
            countIdx++; countQuery += ` AND l.author_id = $${countIdx}`; countParams.push(author_id);
        }
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            entries: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get logbook entries error:', error);
        res.status(500).json({ error: 'Failed to fetch logbook entries' });
    }
});

// Get single logbook entry
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT l.*, u.full_name as author_name
       FROM logbook_entries l
       LEFT JOIN users u ON l.author_id = u.id
       WHERE l.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Logbook entry not found' });
        }

        res.json({ entry: result.rows[0] });
    } catch (error) {
        console.error('Get logbook entry error:', error);
        res.status(500).json({ error: 'Failed to fetch logbook entry' });
    }
});

// Create logbook entry (R&D only)
router.post('/', requireAuth, requireRND, async (req, res) => {
    try {
        const { date, activity_description, attachments, hours_spent } = req.body;

        if (!date || !activity_description) {
            return res.status(400).json({ error: 'Date and activity description required' });
        }

        const result = await db.query(
            `INSERT INTO logbook_entries (date, author_id, activity_description, attachments, hours_spent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [date, req.user.id, activity_description, JSON.stringify(attachments || []), hours_spent]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE_LOGBOOK_ENTRY', 'logbook', result.rows[0].id, JSON.stringify({ date })]
        );

        res.status(201).json({ entry: result.rows[0] });
    } catch (error) {
        console.error('Create logbook entry error:', error);
        res.status(500).json({ error: 'Failed to create logbook entry' });
    }
});

// Update logbook entry (R&D only)
router.put('/:id', requireAuth, requireRND, async (req, res) => {
    try {
        const { id } = req.params;
        const { date, activity_description, attachments, hours_spent } = req.body;

        // Only update fields that are explicitly present in the request body
        const updates = [];
        const values = [];
        let paramIdx = 0;

        if ('date' in req.body) { paramIdx++; updates.push(`date = $${paramIdx}`); values.push(date); }
        if ('activity_description' in req.body) { paramIdx++; updates.push(`activity_description = $${paramIdx}`); values.push(activity_description); }
        if ('attachments' in req.body) { paramIdx++; updates.push(`attachments = $${paramIdx}`); values.push(JSON.stringify(attachments || [])); }
        if ('hours_spent' in req.body) { paramIdx++; updates.push(`hours_spent = $${paramIdx}`); values.push(hours_spent); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        paramIdx++;
        values.push(id);

        const result = await db.query(
            `UPDATE logbook_entries SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Logbook entry not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'UPDATE_LOGBOOK_ENTRY', 'logbook', id]
        );

        res.json({ entry: result.rows[0] });
    } catch (error) {
        console.error('Update logbook entry error:', error);
        res.status(500).json({ error: 'Failed to update logbook entry' });
    }
});

// Delete logbook entry (R&D only)
router.delete('/:id', requireAuth, requireRND, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the entry first to get attachment paths
        const existing = await db.query('SELECT attachments FROM logbook_entries WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Logbook entry not found' });
        }

        const result = await db.query('DELETE FROM logbook_entries WHERE id = $1 RETURNING *', [id]);

        // Cleanup associated attachment files from disk
        const row = existing.rows[0];
        let attachments = [];
        try {
            attachments = typeof row.attachments === 'string' ? JSON.parse(row.attachments) : (row.attachments || []);
        } catch (e) { /* ignore parse errors */ }

        for (const att of attachments) {
            if (att && att.url) {
                const filePath = path.join(UPLOAD_BASE, att.url.replace('/uploads/', ''));
                try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* best effort */ }
            }
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'DELETE_LOGBOOK_ENTRY', 'logbook', id]
        );

        res.json({ message: 'Logbook entry deleted successfully' });
    } catch (error) {
        console.error('Delete logbook entry error:', error);
        res.status(500).json({ error: 'Failed to delete logbook entry' });
    }
});

module.exports = router;
