const bcrypt = require('bcrypt');
const db = require('./config/database');

async function fixAdminPassword() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        console.log('Generated hash:', hash);

        const result = await db.query(
            `UPDATE users SET password_hash = $1, role = 'Admin', status = 'Active' WHERE username = 'admin' RETURNING username, role, status`,
            [hash]
        );

        if (result.rows.length === 0) {
            // User doesn't exist, create it
            console.log('Admin user not found, creating...');
            const createResult = await db.query(
                `INSERT INTO users (username, password_hash, role, full_name, email, status) 
                 VALUES ('admin', $1, 'Admin', 'System Administrator', 'admin@company.local', 'Active')
                 RETURNING username, role, status`,
                [hash]
            );
            console.log('Admin user created:', createResult.rows[0]);
        } else {
            console.log('Admin user updated:', result.rows[0]);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixAdminPassword();
