const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const users = [
    { username: 'ahmad.rnd', password: 'password123' },
    { username: 'budi.viewer', password: 'password123' }
];

async function fixPasswords() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        for (const user of users) {
            const hash = await bcrypt.hash(user.password, 10);
            const result = await client.query(
                'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username',
                [hash, user.username]
            );

            if (result.rows.length > 0) {
                console.log(`Password updated for user: ${user.username}`);
            } else {
                console.log(`User not found: ${user.username}`);
            }
        }
    } catch (err) {
        console.error('Error fixing passwords:', err);
    } finally {
        await client.end();
    }
}

fixPasswords();
