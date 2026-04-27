# Setup R&D Hub di PC Baru

Panduan lengkap untuk install dan menjalankan R&D Hub di komputer baru dari awal.

---

## 📋 Prerequisites - Software yang Harus Diinstall

### 1. Install PostgreSQL

**Download:**
- Kunjungi: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 atau 16 (versi terbaru)

**Install:**
1. Jalankan installer
2. Pilih komponen:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Command Line Tools
3. Set password untuk user `postgres` (INGAT PASSWORD INI!)
4. Port: `5432` (default)
5. Locale: Default
6. Finish installation

**Verifikasi:**
```bash
psql --version
# Output: psql (PostgreSQL) 15.x
```

### 2. Install Node.js

**Download:**
- Kunjungi: https://nodejs.org/
- Download versi **LTS** (Long Term Support) - minimal v18

**Install:**
1. Jalankan installer
2. Centang semua opsi (termasuk "Automatically install necessary tools")
3. Finish installation

**Verifikasi:**
```bash
node --version
# Output: v18.x.x atau lebih tinggi

npm --version
# Output: 9.x.x atau lebih tinggi
```

### 3. Install Git (Opsional, untuk clone repository)

**Download:**
- Kunjungi: https://git-scm.com/download/win
- Download Git for Windows

**Install:**
1. Jalankan installer
2. Gunakan setting default
3. Finish installation

---

## 📦 Cara 1: Copy dari PC Lama (Tercepat)

### Step 1: Copy Folder Project

**Di PC Lama:**
1. Copy seluruh folder `d:\App\RND_Docs` ke USB/network drive
2. Pastikan semua file tercopy (termasuk folder `node_modules` kalau sudah ada)

**Di PC Baru:**
1. Paste folder ke lokasi yang sama: `d:\App\RND_Docs`
2. Atau lokasi lain sesuai keinginan, misal: `C:\Projects\RND_Docs`

### Step 2: Setup Database

**Buka Command Prompt atau PowerShell:**

```bash
# 1. Buat database baru
createdb -U postgres rndhub
# Masukkan password postgres yang dibuat saat install

# 2. Navigate ke folder project
cd d:\App\RND_Docs

# 3. Load schema dan seed users (OTOMATIS)
cd backend
npm run db:setup
# Script ini akan:
# - Load database schema (tables, indexes)
# - Generate bcrypt hash otomatis
# - Create default users (admin, ahmad.rnd, siti.rnd, budi.viewer)

# Atau manual step-by-step:
# psql -U postgres -d rndhub -f ..\database\schema.sql
# npm run seed
```

**Default users yang dibuat:**
- `admin` / `admin123` (Admin - full access)
- `ahmad.rnd` / `password123` (R&D)
- `siti.rnd` / `password123` (R&D)
- `budi.viewer` / `password123` (Viewer)


### Step 3: Configure Environment Variables

**Backend `.env`:**
```bash
cd backend
notepad .env
```

Update isi file `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/rndhub
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=../uploads
CORS_ORIGIN=http://localhost:5173
# Untuk akses dari network, tambahkan IP Anda (pisahkan dengan koma):
# CORS_ORIGIN=http://localhost:5173,http://192.168.x.x:5173
```

**Ganti `PASSWORD_ANDA` dengan password postgres Anda!**

**Frontend `.env`:**
```bash
cd ..\frontend
notepad .env
```

Isi file `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Step 4: Install Dependencies (Jika belum ada node_modules)

**Backend:**
```bash
cd d:\App\RND_Docs\backend
npm install
```

**Frontend:**
```bash
cd d:\App\RND_Docs\frontend
npm install --legacy-peer-deps
```

### Step 5: Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd d:\App\RND_Docs\backend
npm run dev
```

**Output yang diharapkan:**
```
🚀 R&D Hub API server running on port 3000
📡 Environment: development
🔗 CORS enabled for: http://localhost:5173
✅ Connected to PostgreSQL database
```

**Terminal 2 - Frontend:**
```bash
cd d:\App\RND_Docs\frontend
npm run dev
```

**Output yang diharapkan:**
```
  VITE v5.x.x  ready in X ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 6: Login

1. Buka browser: `http://localhost:5173`
2. Login dengan salah satu user:
   - **Admin**: `admin` / `admin123`
   - **R&D**: `ahmad.rnd` / `password123`
   - **R&D**: `siti.rnd` / `password123`
   - **Viewer**: `budi.viewer` / `password123`

---

## 📦 Cara 2: Clone dari Git Repository (Jika ada)

### Step 1: Clone Repository

```bash
cd d:\App
git clone <URL_REPOSITORY> RND_Docs
cd RND_Docs
```

### Step 2-6: Sama seperti Cara 1 di atas

---

## 📦 Cara 3: Setup dari Nol (Tanpa Copy)

Jika Anda tidak punya akses ke PC lama, ikuti tutorial lengkap di:
- **TUTORIAL.md** - Untuk testing dengan mock data
- **QUICKSTART.md** - Untuk production tanpa mock data

---

## 🔧 Troubleshooting

### Problem 1: "createdb: command not found"

**Solusi:**
PostgreSQL belum masuk ke PATH. Tambahkan manual:

1. Cari folder instalasi PostgreSQL, biasanya:
   ```
   C:\Program Files\PostgreSQL\15\bin
   ```

2. Tambahkan ke PATH:
   - Klik kanan "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Pilih "Path" di System variables → Edit
   - Klik "New" → Paste path PostgreSQL bin
   - OK semua

3. Restart Command Prompt dan coba lagi

**Alternatif:** Gunakan full path
```bash
"C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres rndhub
```

### Problem 2: "password authentication failed for user postgres"

**Solusi:**
Password salah atau user tidak ada.

**Reset password postgres:**
1. Buka pgAdmin 4
2. Klik kanan PostgreSQL server → Properties
3. Atau reinstall PostgreSQL dan catat password dengan benar

### Problem 3: "npm: command not found"

**Solusi:**
Node.js belum terinstall atau belum masuk PATH.

1. Verifikasi instalasi:
   ```bash
   where node
   where npm
   ```

2. Jika tidak ada output, reinstall Node.js
3. Restart Command Prompt setelah install

### Problem 4: "Port 3000 already in use"

**Solusi:**
Ada aplikasi lain yang pakai port 3000.

**Opsi 1 - Kill process:**
```bash
# Cari process yang pakai port 3000
netstat -ano | findstr :3000

# Kill process (ganti PID dengan nomor dari output di atas)
taskkill /PID <PID> /F
```

**Opsi 2 - Ganti port:**
Edit `backend\.env`:
```env
PORT=3001
```

Dan `frontend\.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### Problem 5: "Cannot find module 'express'"

**Solusi:**
Dependencies belum terinstall.

```bash
cd backend
npm install

cd ..\frontend
npm install --legacy-peer-deps
```

### Problem 6: Frontend blank page / Cannot connect to API

**Solusi:**

1. **Cek backend running:**
   ```bash
   # Buka di browser
   http://localhost:3000/api/auth/me
   # Harus ada response (meskipun error 401)
   ```

2. **Cek CORS settings:**
   File `backend\.env`:
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Cek API URL:**
   File `frontend\.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Restart kedua server** setelah ubah .env

### Problem 7: Database connection error

**Solusi:**

1. **Cek PostgreSQL service running:**
   - Buka Services (Win + R → `services.msc`)
   - Cari "postgresql-x64-15" atau similar
   - Pastikan status "Running"
   - Jika tidak, klik kanan → Start

2. **Cek DATABASE_URL:**
   ```env
   DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/rndhub
   ```
   - Ganti PASSWORD dengan password postgres Anda
   - Pastikan database `rndhub` sudah dibuat

3. **Test koneksi manual:**
   ```bash
   psql -U postgres -d rndhub
   # Jika berhasil, akan masuk ke postgres prompt
   # Ketik \q untuk keluar
   ```

---

## 🌐 Setup untuk Akses dari PC Lain (Network)

Jika ingin PC lain di jaringan bisa akses:

### Step 1: Cari IP Address PC Server

```bash
ipconfig
```

Cari "IPv4 Address", contoh: `192.168.1.100`

### Step 2: Configure Firewall

**Windows Firewall:**
1. Control Panel → Windows Defender Firewall
2. Advanced settings
3. Inbound Rules → New Rule
4. Port → TCP → 3000, 5173
5. Allow the connection
6. Apply to all profiles
7. Name: "R&D Hub"

### Step 3: Update Frontend .env

```env
VITE_API_URL=http://192.168.1.100:3000/api
```

### Step 4: Restart Frontend

```bash
cd frontend
npm run dev
```

### Step 5: Akses dari PC Lain

Di PC lain, buka browser:
```
http://192.168.1.100:5173
```

---

## 📝 Checklist Setup

Gunakan checklist ini untuk memastikan semua sudah benar:

### Prerequisites
- [ ] PostgreSQL terinstall dan service running
- [ ] Node.js v18+ terinstall
- [ ] Git terinstall (opsional)

### Database
- [ ] Database `rndhub` sudah dibuat
- [ ] Schema sudah di-load (`schema.sql`)
- [ ] (Opsional) Mock data sudah di-load (`seed.sql`)
- [ ] Bisa login ke database: `psql -U postgres -d rndhub`

### Backend
- [ ] Folder `backend` ada
- [ ] File `.env` sudah dibuat dan dikonfigurasi
- [ ] `DATABASE_URL` sudah benar (password postgres)
- [ ] Dependencies terinstall (`node_modules` ada)
- [ ] Server bisa jalan: `npm run dev`
- [ ] Bisa akses: `http://localhost:3000/api/auth/me`

### Frontend
- [ ] Folder `frontend` ada
- [ ] File `.env` sudah dibuat
- [ ] `VITE_API_URL` sudah benar
- [ ] Dependencies terinstall (`node_modules` ada)
- [ ] Server bisa jalan: `npm run dev`
- [ ] Bisa akses: `http://localhost:5173`

### Testing
- [ ] Bisa buka halaman login
- [ ] Bisa login dengan `ahmad.rnd` / `password123`
- [ ] Dashboard muncul dengan benar
- [ ] Bisa navigasi ke Projects, Logbook, Errors
- [ ] (Jika pakai seed data) Ada data mock yang muncul

---

## 🚀 Quick Commands Reference

**Database:**
```bash
# Create database
createdb -U postgres rndhub

# Load schema
psql -U postgres -d rndhub -f database\schema.sql

# Load mock data
psql -U postgres -d rndhub -f database\seed.sql

# Connect to database
psql -U postgres -d rndhub

# Drop database (reset)
dropdb -U postgres rndhub
```

**Backend:**
```bash
cd backend
npm install                 # Install dependencies
npm run dev                 # Start development server
npm run seed                # Seed/reseed default users
npm run db:setup            # Full database setup (schema + seed)
```


**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps    # Install dependencies
npm run dev                        # Start development server
npm run build                      # Build for production
```

---

## 📞 Butuh Bantuan?

Jika masih ada masalah:

1. **Cek log error** di terminal backend dan frontend
2. **Cek browser console** (F12 → Console tab)
3. **Verifikasi semua checklist** di atas sudah ✅
4. **Lihat troubleshooting** di atas untuk masalah umum

---

## 🎉 Selamat!

Jika semua checklist sudah ✅, sistem R&D Hub sudah siap digunakan!

**Default Login:**
- R&D User: `ahmad.rnd` / `password123`
- Viewer: `budi.viewer` / `password123`
- Admin: `admin` / `admin123` (jika sudah run `fix-admin.js`)

**Jangan lupa:**
- Ganti password default untuk production
- Backup database secara berkala
- Update `JWT_SECRET` di production
