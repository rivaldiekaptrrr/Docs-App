const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Smart CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Parse allowed origins from env
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // In development, allow any localhost or local network IP
        if (isDevelopment) {
            // Allow localhost with any port
            if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
                return callback(null, true);
            }
            // Allow 127.0.0.1 with any port
            if (origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)) {
                return callback(null, true);
            }
            // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            if (origin.match(/^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/)) {
                return callback(null, true);
            }
        }

        // Check configured origins (both dev and production)
        if (configuredOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Reject in production, allow in development for debugging
        if (isDevelopment) {
            console.warn(`⚠️  CORS: Allowing unconfigured origin in development: ${origin}`);
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const projectMembersRoutes = require('./routes/projectMembers');
const documentationRoutes = require('./routes/documentation');
const logbookRoutes = require('./routes/logbook');
const errorReportsRoutes = require('./routes/errors');
const usersRoutes = require('./routes/users');
const activityRoutes = require('./routes/activity');
const settingsRoutes = require('./routes/settings');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-members', projectMembersRoutes);
app.use('/api/documentation', documentationRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/errors', errorReportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 R&D Hub API server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (isDevelopment) {
        console.log(`🔓 CORS: Development mode - allowing all local network IPs`);
    } else {
        console.log(`🔒 CORS: Production mode - only configured origins: ${configuredOrigins.join(', ')}`);
    }
});
