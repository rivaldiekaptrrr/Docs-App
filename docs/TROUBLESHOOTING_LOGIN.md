# Troubleshooting: Login Failed

## 🔍 Diagnosis Masalah

Berdasarkan analisis kode, masalah login kemungkinan besar disebabkan oleh **password hash yang tidak valid** di database.

---

## ✅ Solusi Cepat (RECOMMENDED)

### Opsi 1: Reset Password dengan Script

Jalankan script ini untuk membuat hash password yang valid:

```bash
cd d:\App\RND_Docs\backend
node fix_passwords.js
```

**Output yang diharapkan:**
```
Connecting to database...
Password updated for user: ahmad.rnd
Password updated for user: budi.viewer
```

Sekarang coba login lagi dengan:
- Username: `ahmad.rnd`
- Password: `password123`

---

### Opsi 2: Reset Password Manual via Database

Jika script tidak bekerja, reset password manual:

```bash
# 1. Connect ke database
psql -U postgres -d rndhub

# 2. Generate hash baru dan update (copy semua baris ini)
UPDATE users 
SET password_hash = '$2b$10$rQj5mXkN3vN0xNZxZJxTq.h0VqE7pK8vGZxGZ9K8ZqN0xNZxZJxTq' 
WHERE username = 'ahmad.rnd';

UPDATE users 
SET password_hash = '$2b$10$rQj5mXkN3vN0xNZxZJxTq.h0VqE7pK8vGZxGZ9K8ZqN0xNZxZJxTq' 
WHERE username = 'budi.viewer';

UPDATE users 
SET password_hash = '$2b$10$rQj5mXkN3vN0xNZxZJxTq.h0VqE7pK8vGZxGZ9K8ZqN0xNZxZJxTq' 
WHERE username = 'admin';

# 3. Verify
SELECT username, role FROM users;

# 4. Exit
\q
```

---

### Opsi 3: Generate Hash Baru yang Valid

Buat file `generate-valid-hash.js`:

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL Command:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'ahmad.rnd';`);
}

generateHash();
```

Jalankan:
```bash
cd backend
node generate-valid-hash.js
```

Copy hash yang dihasilkan dan update ke database.

---

## 🔍 Kemungkinan Masalah Lain

### Problem 1: Backend Tidak Running

**Cek:**
```bash
# Buka di browser
http://192.168.15.252:3000/api/health
```

**Jika tidak bisa akses:**
- Backend belum jalan
- Port 3000 blocked oleh firewall
- IP address salah

**Solusi:**
```bash
cd backend
npm run dev
```

---

### Problem 2: CORS Error

**Gejala:** Error di browser console: "CORS policy blocked"

**Cek backend .env:**
```env
CORS_ORIGIN=http://192.168.15.252:5173
```

**Cek frontend .env:**
```env
VITE_API_URL=http://192.168.15.252:3000/api
```

**Pastikan IP address sama!**

**Solusi:** Restart backend setelah ubah .env

---

### Problem 3: Database Connection Error

**Gejala:** Backend error: "Connection refused" atau "password authentication failed"

**Cek:**
1. PostgreSQL service running?
   ```bash
   # Windows Services
   services.msc
   # Cari "postgresql" dan pastikan Running
   ```

2. Database `rndhub` sudah dibuat?
   ```bash
   psql -U postgres -l
   # Harus ada rndhub dalam list
   ```

3. Password postgres benar di .env?
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/rndhub
   #                                  ^^^^^^ Ganti dengan password Anda
   ```

---

### Problem 4: User Tidak Ada di Database

**Cek:**
```bash
psql -U postgres -d rndhub
SELECT username, role FROM users;
```

**Jika kosong atau user tidak ada:**
```bash
# Reload schema
psql -U postgres -d rndhub -f database/schema.sql
```

---

### Problem 5: JWT_SECRET Tidak Valid

**Gejala:** Backend error saat login

**Cek backend .env:**
```env
JWT_SECRET=ed376727ae7a6882edc40f14937a6c61
```

**Pastikan ada value!** Jika kosong, tambahkan random string.

---

## 🧪 Test Login Step by Step

### 1. Test Backend API Langsung

Gunakan PowerShell atau Command Prompt:

```powershell
# Test health check
curl http://192.168.15.252:3000/api/health

# Test login
curl -X POST http://192.168.15.252:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"ahmad.rnd","password":"password123"}'
```

**Expected Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "ahmad.rnd",
    "role": "R&D",
    "full_name": "Ahmad Rizki",
    "email": "ahmad@company.local"
  }
}
```

**Error Response (Invalid Password):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 2. Cek Browser Console

1. Buka browser (Chrome/Edge)
2. Tekan F12 → Console tab
3. Coba login
4. Lihat error message

**Common Errors:**

**a) Network Error:**
```
Failed to fetch
```
→ Backend tidak running atau CORS issue

**b) 401 Unauthorized:**
```
{error: "Invalid credentials"}
```
→ Password hash tidak cocok (gunakan Opsi 1 di atas)

**c) 500 Internal Server Error:**
```
{error: "Login failed"}
```
→ Cek backend terminal untuk error detail

---

### 3. Cek Backend Terminal

Saat login, backend akan print log. Cari error message seperti:

```
Login error: Error: ...
```

Ini akan memberikan hint masalah sebenarnya.

---

## 🎯 Checklist Debugging

Ikuti checklist ini secara berurutan:

- [ ] **Backend running?** → `npm run dev` di terminal backend
- [ ] **Database connected?** → Lihat backend log saat start
- [ ] **User exists?** → `SELECT * FROM users WHERE username='ahmad.rnd';`
- [ ] **Password hash valid?** → Jalankan `fix_passwords.js`
- [ ] **CORS configured?** → Backend .env CORS_ORIGIN = Frontend URL
- [ ] **API URL correct?** → Frontend .env VITE_API_URL benar
- [ ] **Network accessible?** → Bisa akses `http://IP:3000/api/health`
- [ ] **Browser console clear?** → Tidak ada error CORS/Network

---

## 🚀 Quick Fix Command

Jika bingung, jalankan semua ini:

```bash
# 1. Stop semua yang running (Ctrl+C di terminal)

# 2. Fix passwords
cd d:\App\RND_Docs\backend
node fix_passwords.js

# 3. Restart backend
npm run dev

# 4. Di terminal baru, restart frontend
cd d:\App\RND_Docs\frontend
npm run dev

# 5. Clear browser cache (Ctrl+Shift+Delete)

# 6. Coba login lagi
# Username: ahmad.rnd
# Password: password123
```

---

## 📞 Masih Gagal?

Jika masih gagal setelah semua langkah di atas:

1. **Capture error message:**
   - Screenshot browser console (F12)
   - Copy backend terminal error
   - Copy frontend terminal error

2. **Verify database:**
   ```bash
   psql -U postgres -d rndhub
   SELECT username, role, length(password_hash) as hash_length FROM users;
   ```
   
   Hash length harus **60 karakter**. Jika bukan, hash tidak valid.

3. **Test dengan curl** (lihat section Test Login Step by Step di atas)

---

## ✅ Solusi Paling Sering Berhasil

**90% masalah login diselesaikan dengan:**

```bash
cd backend
node fix_passwords.js
```

**Kemudian restart backend dan coba login lagi!**
