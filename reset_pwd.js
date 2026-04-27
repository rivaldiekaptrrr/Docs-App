const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

async function resetPassword() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const hash = await bcrypt.hash('password123', 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'ahmad.rnd']);
        console.log('Password for ahmad.rnd has been reset to "password123"');
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
