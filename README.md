# R&D Hub & Knowledge Management System

A comprehensive web-based platform for internal knowledge management, technical reporting, and daily activity tracking with visual documentation support.

---

## 📖 Quick Guide Selection

**Choose the right guide for your needs:**

### 🧪 For Testing/Demo/Learning → Use [TUTORIAL.md](TUTORIAL.md)
- ✅ Includes **mock data** (3 projects, 6 docs, 5 logbook entries, 4 error reports)
- ✅ Step-by-step setup with **6 detailed test scenarios**
- ✅ Realistic Indonesian data for demonstration
- ✅ Perfect for: Development, testing, demos, training
- **Run (Database):** `schema.sql` + `seed.sql`
- **Run (No Database):** Just start backend without `.env` (Mock Mode)


### 🚀 For Production/Real Use → Use [QUICKSTART.md](QUICKSTART.md)
- ✅ **Clean database** with only default users
- ✅ Quick setup without sample data
- ✅ Production-ready configuration
- ✅ Perfect for: Production deployment, real team use
- **Run:** `schema.sql` only (no seed data)

### 📚 For Technical Reference → Read this README
- Complete API documentation
- Architecture overview
- Network deployment guide
- All available endpoints

---

## Project Structure

```
rnd-hub/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── database/          # Database migrations & schema
├── uploads/           # Image storage directory
└── README.md
```

## Features

- **User Management**: Role-based access control (R&D / Viewer)
- **Project Documentation**: Grid-based project cards with rich text editing
- **Daily Logbook**: Activity tracking with image attachments
- **Error Reporting**: Before/after troubleshooting documentation
- **Visual Documentation**: Screenshot paste from clipboard support
- **Local Network Access**: Accessible from any PC on the network

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- bcrypt for password hashing

### Frontend
- React 19
- Vite
- React Router
- Axios
- React Quill (Rich text editor)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- npm or yarn

### Database Setup

1. Create PostgreSQL database:
```bash
createdb rndhub
```

2. Run the schema:
```bash
psql -d rndhub -f database/schema.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and configure your database connection:
```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/rndhub
JWT_SECRET=your-super-secret-jwt-key
```

4. Install dependencies and start server:
```bash
npm install
Server will run on `http://localhost:3000`

### 🧪 Mock Mode (No Database Required)

You can run the entire system without installing or configuring PostgreSQL. This is perfect for demos or quick development.

1. **Activation**: Simply do **NOT** create a `.env` file in the `backend` folder, or set `MOCK_MODE=true` in your `.env`.
2. **Built-in Data**: The system will use in-memory data (Projects, Docs, Logbooks) that resets every time the server restarts.
3. **Start**:
   ```bash
   cd backend
   npm install
   node index.js
   ```
4. **Mock Credentials**:
   - **Admin**: `admin` / `password123`
   - **R&D**: `rnd_user` / `password123`
   - **Viewer**: `viewer` / `password123`


### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Install dependencies and start dev server:
```bash
npm install --legacy-peer-deps
npm run dev
```

Frontend will run on `http://localhost:5173`

## Default Users

After running the database schema, you can login with:

- **R&D User**: 
  - Username: `ahmad.rnd`
  - Password: `password123`

- **Viewer User**: 
  - Username: `budi.viewer`
  - Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (R&D only)
- `PUT /api/projects/:id` - Update project (R&D only)
- `DELETE /api/projects/:id` - Delete project (R&D only)

### Documentation
- `GET /api/documentation/project/:projectId` - Get project docs
- `GET /api/documentation/:id` - Get single document
- `POST /api/documentation` - Create document (R&D only)
- `PUT /api/documentation/:id` - Update document (R&D only)
- `DELETE /api/documentation/:id` - Delete document (R&D only)

### Logbook
- `GET /api/logbook` - Get logbook entries (with filters)
- `GET /api/logbook/:id` - Get single entry
- `POST /api/logbook` - Create entry (R&D only)
- `PUT /api/logbook/:id` - Update entry (R&D only)
- `DELETE /api/logbook/:id` - Delete entry (R&D only)

### Error Reports
- `GET /api/errors` - List error reports (with filters)
- `GET /api/errors/:id` - Get single error report
- `POST /api/errors` - Create error report (R&D only)
- `PUT /api/errors/:id` - Update error report (R&D only)
- `PATCH /api/errors/:id/status` - Update status (R&D only)
- `DELETE /api/errors/:id` - Delete error report (R&D only)

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/base64` - Upload from clipboard (base64)

## Local Network Deployment

To make the system accessible from other PCs on your local network:

1. Configure backend to listen on all interfaces (already set to `0.0.0.0`)
2. Find your machine's local IP address:
   ```bash
   ipconfig
   ```
3. Configure Windows Firewall to allow incoming connections on port 3000 and 5173
4. Update frontend `.env` with your machine's IP:
   ```
   VITE_API_URL=http://192.168.x.x:3000/api
   ```
5. Access from other PCs using: `http://192.168.x.x:5173`

## License

Internal use only - Company R&D Department
