const bcrypt = require('bcrypt');
const db = require('./config/database');

/**
 * Seed default users for DocuStack
 * This script is idempotent - safe to run multiple times
 */

const DEFAULT_USERS = [
    {
        username: 'admin',
        password: 'admin123', // Change in production!
        role: 'Admin',
        full_name: 'System Administrator',
        email: 'admin@company.local'
    },
    {
        username: 'ahmad.rnd',
        password: 'password123',
        role: 'R&D',
        full_name: 'Ahmad Rizki',
        email: 'ahmad@company.local'
    },
    {
        username: 'siti.rnd',
        password: 'password123',
        role: 'R&D',
        full_name: 'Siti Nurhaliza',
        email: 'siti@company.local'
    },
    {
        username: 'budi.viewer',
        password: 'password123',
        role: 'Viewer',
        full_name: 'Budi Santoso',
        email: 'budi@company.local'
    }
];

async function seedUsers() {
    console.log('🌱 Seeding default users...\n');

    try {
        for (const user of DEFAULT_USERS) {
            // Generate hash
            const hash = await bcrypt.hash(user.password, 10);

            // Insert or update user
            const result = await db.query(
                `INSERT INTO users (username, password_hash, role, full_name, email, status)
                 VALUES ($1, $2, $3, $4, $5, 'Active')
                 ON CONFLICT (username) 
                 DO UPDATE SET 
                    password_hash = $2,
                    role = $3,
                    full_name = $4,
                    email = $5,
                    status = 'Active'
                 RETURNING username, role`,
                [user.username, hash, user.role, user.full_name, user.email]
            );

            if (result.rows.length > 0) {
                console.log(`✅ ${result.rows[0].username.padEnd(15)} | ${result.rows[0].role.padEnd(10)} | Password: ${user.password}`);
            }
        }

        console.log('\n✅ All users seeded successfully!');
        console.log('\n⚠️  IMPORTANT: Change default passwords in production!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedUsers();
}

module.exports = { seedUsers, DEFAULT_USERS };
