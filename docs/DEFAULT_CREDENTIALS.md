# R&D Hub - Default User Credentials

All users are created by the `npm run seed` script with auto-generated bcrypt hashes.

## Available Users:

### 1. Admin User
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin
- **Access:** Full system access including user management, activity logs, and system settings

### 2. R&D User 1
- **Username:** `ahmad.rnd`
- **Password:** `password123`
- **Role:** R&D
- **Access:** Can create and edit projects, documentation, logbook, and error reports

### 3. R&D User 2
- **Username:** `siti.rnd`
- **Password:** `password123`
- **Role:** R&D
- **Access:** Can create and edit projects, documentation, logbook, and error reports

### 4. Viewer User
- **Username:** `budi.viewer`
- **Password:** `password123`
- **Role:** Viewer
- **Access:** Read-only access to all content

## Notes:
- Passwords are automatically hashed with bcrypt when running `npm run seed`
- To change passwords, edit `backend/seed-users.js` and run `npm run seed` again
- ⚠️ **IMPORTANT**: Change these default passwords in production!
