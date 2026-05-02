const path = require('path');
const fs   = require('fs');

// ─── Detect Mock Mode ─────────────────────────────────────────────────────────
// Mock mode is activated when:
//   1. No .env file exists in the backend directory, OR
//   2. DATABASE_URL is not set after loading .env, OR
//   3. MOCK_MODE=true is explicitly set in .env / environment
const envPath  = path.resolve(__dirname, '../.env');
const envExists = fs.existsSync(envPath);

const MOCK_MODE =
    !envExists ||
    !process.env.DATABASE_URL ||
    process.env.MOCK_MODE === 'true';

if (MOCK_MODE) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║        🧪  MOCK MODE ACTIVE (No Database)        ║');
    console.log('║  Running with in-memory demo data.               ║');
    console.log('║  Default credentials:                            ║');
    console.log('║    Admin   → admin / password123                 ║');
    console.log('║    Tech    → tech_user / password123             ║');
    console.log('║    Viewer  → viewer / password123                ║');
    console.log('║  Data resets on every server restart.            ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    module.exports = require('../mock/mockDb');
} else {
    // ── Real PostgreSQL connection ─────────────────────────────────────────────
    const { Pool } = require('pg');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max:                    20,
        idleTimeoutMillis:   30000,
        connectionTimeoutMillis: 2000,
    });

    pool.on('connect', () => {
        console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
        console.error('❌ Unexpected error on idle client', err);
        process.exit(-1);
    });

    const query = async (text, params) => {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    };

    const getClient = async () => {
        const client  = await pool.connect();
        const _query  = client.query.bind(client);
        const release = client.release.bind(client);

        const timeout = setTimeout(() => {
            console.error('A client has been checked out for more than 5 seconds!');
        }, 5000);

        client.query = (...args) => {
            client.lastQuery = args;
            return _query(...args);
        };

        client.release = () => {
            clearTimeout(timeout);
            client.query   = _query;
            client.release = release;
            return release();
        };

        return client;
    };

    module.exports = { query, getClient, pool };
}
