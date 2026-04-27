const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await db.query(
            'SELECT id, username, role, full_name, email FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Require R&D or Admin role
const requireRND = (req, res, next) => {
    if (req.user.role !== 'R&D' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. R&D or Admin role required.' });
    }
    next();
};

// Require Admin role only
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Require authentication (any role)
const requireAuth = verifyToken;

module.exports = {
    verifyToken,
    requireRND,
    requireAuth,
    requireAdmin
};
