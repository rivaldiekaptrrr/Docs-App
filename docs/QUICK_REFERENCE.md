# 🚀 R&D Hub - Quick Reference

## 📝 Default Login Credentials

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Full access + Admin panel |
| `ahmad.rnd` | `password123` | R&D | Create/Edit projects |
| `siti.rnd` | `password123` | R&D | Create/Edit projects |
| `budi.viewer` | `password123` | Viewer | Read-only |

⚠️ Change passwords in production by editing `backend/seed-users.js` and running `npm run seed`

---

## 🛠️ Common Commands

### Database Setup
```bash
# Full setup (schema + users)
cd backend
npm run db:setup

# Or step by step:
createdb -U postgres rndhub
psql -U postgres -d rndhub -f ../database/schema.sql
npm run seed
```

### Development
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### User Management
```bash
# Reseed users (safe to run multiple times)
cd backend
npm run seed
```

---

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### Network Access (from other devices)
Replace `localhost` with your PC's IP (e.g., `192.168.1.100`)
- Development mode auto-allows all local network IPs
- No configuration needed!

---

## 🔧 Environment Files

### Backend `.env`
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rndhub
JWT_SECRET=your-secret-key
UPLOAD_DIR=../uploads
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📁 Project Structure

```
RND_Docs/
├── backend/          # Node.js + Express API
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth, validation
│   ├── config/       # Database config
│   └── seed-users.js # User seeding script
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   └── services/ # API calls
│   └── public/
├── database/         # SQL schemas
└── uploads/          # File uploads
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Run `npm run seed` in backend folder |
| CORS error | Check `CORS_ORIGIN` in backend/.env |
| Port in use | Change `PORT` in backend/.env |
| DB connection error | Check `DATABASE_URL` password |
| Frontend blank | Verify backend is running on port 3000 |

---

## 📚 Full Documentation

- **SETUP_NEW_PC.md** - Complete setup guide
- **DEFAULT_CREDENTIALS.md** - All user credentials
- **backend/seed-users.js** - Edit to change passwords

---

**Need help?** Check the full documentation or run `npm run seed` to reset users.
