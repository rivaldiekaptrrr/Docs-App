const bcrypt = require('bcrypt');

// Generate valid bcrypt hashes for password 'password123'
async function generateHashes() {
    const password = 'password123';
    
    console.log('Generating bcrypt hashes for password:', password);
    console.log('');
    
    const users = ['admin', 'ahmad.rnd', 'siti.rnd', 'budi.viewer'];
    
    for (const user of users) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`${user}:`);
        console.log(`'${hash}',`);
        console.log('');
    }
}

generateHashes();
