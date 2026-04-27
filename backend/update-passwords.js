const bcrypt = require('bcrypt');
const db = require('./config/database');

async function updateAllPasswords() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        console.log('Generated hash for password123:', hash);

        // Update all users
        const users = ['admin', 'ahmad.rnd', 'siti.rnd', 'budi.viewer'];

        for (const username of users) {
            const result = await db.query(
                'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username, role',
                [hash, username]
            );

            if (result.rows.length > 0) {
                console.log(`✅ Updated password for: ${result.rows[0].username} (${result.rows[0].role})`);
            } else {
                console.log(`⚠️  User not found: ${username}`);
            }
        }

        console.log('\n✅ All passwords updated successfully!');
        console.log('Password for all users: password123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateAllPasswords();
