const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get activity logs (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { user_id, action, resource_type, start_date, end_date, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, u.username, u.full_name
            FROM activity_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (user_id) {
            paramCount++;
            query += ` AND a.user_id = $${paramCount}`;
            params.push(user_id);
        }

        if (action) {
            paramCount++;
            query += ` AND a.action = $${paramCount}`;
            params.push(action);
        }

        if (resource_type) {
            paramCount++;
            query += ` AND a.resource_type = $${paramCount}`;
            params.push(resource_type);
        }

        if (start_date) {
            paramCount++;
            query += ` AND a.timestamp >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND a.timestamp <= $${paramCount}`;
            params.push(end_date);
        }

        query += ` ORDER BY a.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM activity_log a WHERE 1=1';
        const countParams = [];
        let countIdx = 0;

        if (user_id) { countIdx++; countQuery += ` AND a.user_id = $${countIdx}`; countParams.push(user_id); }
        if (action) { countIdx++; countQuery += ` AND a.action = $${countIdx}`; countParams.push(action); }
        if (resource_type) { countIdx++; countQuery += ` AND a.resource_type = $${countIdx}`; countParams.push(resource_type); }
        if (start_date) { countIdx++; countQuery += ` AND a.timestamp >= $${countIdx}`; countParams.push(start_date); }
        if (end_date) { countIdx++; countQuery += ` AND a.timestamp <= $${countIdx}`; countParams.push(end_date); }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Get activity statistics (Admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        // Get total activities in the last N days
        const totalResult = await db.query(
            'SELECT COUNT(*) as total FROM activity_log WHERE timestamp >= NOW() - INTERVAL \'1 day\' * $1',
            [days]
        );

        // Get activities by action type
        const byActionResult = await db.query(
            `SELECT action, COUNT(*) as count 
             FROM activity_log 
             WHERE timestamp >= NOW() - INTERVAL '1 day' * $1
             GROUP BY action 
             ORDER BY count DESC 
             LIMIT 10`,
            [days]
        );

        // Get most active users
        const byUserResult = await db.query(
            `SELECT u.username, u.full_name, COUNT(*) as activity_count
             FROM activity_log a
             JOIN users u ON a.user_id = u.id
             WHERE a.timestamp >= NOW() - INTERVAL '1 day' * $1
             GROUP BY u.id, u.username, u.full_name
             ORDER BY activity_count DESC
             LIMIT 10`,
            [days]
        );

        // Get daily activity trend
        const trendResult = await db.query(
            `SELECT DATE(timestamp) as date, COUNT(*) as count
             FROM activity_log
             WHERE timestamp >= NOW() - INTERVAL '1 day' * $1
             GROUP BY DATE(timestamp)
             ORDER BY date DESC`,
            [days]
        );

        res.json({
            total: parseInt(totalResult.rows[0].total),
            by_action: byActionResult.rows,
            by_user: byUserResult.rows,
            daily_trend: trendResult.rows
        });
    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({ error: 'Failed to fetch activity statistics' });
    }
});

// Get unique action types (for filter dropdown)
router.get('/actions', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT DISTINCT action FROM activity_log ORDER BY action'
        );

        res.json({ actions: result.rows.map(r => r.action) });
    } catch (error) {
        console.error('Get actions error:', error);
        res.status(500).json({ error: 'Failed to fetch actions' });
    }
});

module.exports = router;
