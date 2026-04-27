const bcrypt = require('bcrypt');

// Generate password hash for admin user
const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to update admin user:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
});
