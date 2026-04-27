const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all system settings (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, setting_key, setting_value, setting_type, description, updated_at FROM system_settings ORDER BY setting_key'
        );

        res.json({ settings: result.rows });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Get single setting by key
router.get('/:key', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;

        const result = await db.query(
            'SELECT id, setting_key, setting_value, setting_type, description FROM system_settings WHERE setting_key = $1',
            [key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        res.json({ setting: result.rows[0] });
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
});

// Update setting (Admin only)
router.put('/:key', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { setting_value } = req.body;

        if (setting_value === undefined) {
            return res.status(400).json({ error: 'setting_value is required' });
        }

        const result = await db.query(
            `UPDATE system_settings 
             SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE setting_key = $3 
             RETURNING id, setting_key, setting_value, setting_type, description`,
            [setting_value, req.user.id, key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, metadata) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'UPDATE_SETTING', 'system_setting', JSON.stringify({ key, value: setting_value })]
        );

        res.json({ setting: result.rows[0] });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// Bulk update settings (Admin only)
router.post('/bulk-update', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { settings } = req.body; // Array of { key, value }

        if (!Array.isArray(settings) || settings.length === 0) {
            return res.status(400).json({ error: 'Settings array is required' });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            for (const { key, value } of settings) {
                await client.query(
                    'UPDATE system_settings SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $3',
                    [value, req.user.id, key]
                );
            }

            await client.query('COMMIT');

            // Log activity
            await db.query(
                'INSERT INTO activity_log (user_id, action, resource_type, metadata) VALUES ($1, $2, $3, $4)',
                [req.user.id, 'BULK_UPDATE_SETTINGS', 'system_setting', JSON.stringify({ count: settings.length })]
            );

            res.json({ message: 'Settings updated successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Bulk update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
