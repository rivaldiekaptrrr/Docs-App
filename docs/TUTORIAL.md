# Tutorial: Using Mock Data in R&D Hub

This tutorial will guide you through setting up the R&D Hub system with mock data for testing and demonstration purposes.

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ PostgreSQL installed and running
- ✅ Node.js v18+ installed
- ✅ npm or yarn installed

## 🚀 Step-by-Step Setup with Mock Data

### Step 1: Create the Database

Open your terminal and create a new PostgreSQL database:

```bash
createdb rndhub
```

**Expected output:**
```
CREATE DATABASE
```

### Step 2: Load the Database Schema

Navigate to your project directory and run the schema file:

```bash
cd d:\App\RND_Docs\rnd-hub
psql -d rndhub -f database/schema.sql
```

**What this does:**
- Creates all 7 tables (users, projects, documentation, logbook_entries, error_reports, media_files, activity_log)
- Creates indexes for performance
- Inserts 3 default users with hashed passwords

**Expected output:**
```
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
...
INSERT 0 3
```

### Step 3: Load Mock Data

Now populate the database with realistic test data:

```bash
psql -d rndhub -f database/seed.sql
```

**What this creates:**
- ✅ 3 Projects (ERP, IoT Dashboard, Mobile App)
- ✅ 6 Documentation entries
- ✅ 5 Logbook entries with activities
- ✅ 4 Error reports with different statuses

**Expected output:**
```sql
INSERT 0 3
INSERT 0 6
INSERT 0 5
INSERT 0 4
Seed data inserted successfully!
 total_users | total_projects | total_documentation | total_logbook_entries | total_error_reports 
-------------+----------------+---------------------+-----------------------+--------------------
           3 |              3 |                   6 |                     5 |                  4
```

### Step 4: Install Backend Dependencies

Navigate to the backend directory and install packages:

```bash
cd backend
npm install
```

**Wait for installation to complete** (may take 1-2 minutes)

### Step 5: Configure Backend Environment

The `.env` file is already created. Verify the database connection:

```bash
notepad .env
```

Make sure `DATABASE_URL` matches your PostgreSQL setup:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rndhub
```

Replace `postgres`, `password` with your PostgreSQL username and password if different.

### Step 6: Start the Backend Server

```bash
npm run dev
```

**Expected output:**
```
🚀 R&D Hub API server running on port 3000
📡 Environment: development
🔗 CORS enabled for: http://localhost:5173
✅ Connected to PostgreSQL database
```

**Keep this terminal open!** The backend server is now running.

### Step 7: Install Frontend Dependencies

Open a **NEW terminal** and navigate to the frontend directory:

```bash
cd d:\App\RND_Docs\rnd-hub\frontend
npm install --legacy-peer-deps
```

**Wait for installation to complete** (may take 1-2 minutes)

### Step 8: Start the Frontend Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in X ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal open too!** The frontend dev server is now running.

---

## 🎯 Testing the Application with Mock Data

### Step 9: Login and Explore

1. **Open your browser** and go to: `http://localhost:5173`

2. **Login with R&D account:**
   - Username: `ahmad.rnd`
   - Password: `password123`

3. **You should see the Dashboard** with:
   - Total Projects: 3
   - Recent Activities: 5
   - Pending Errors: 1

---

## 🧪 Test Scenarios

### Test 1: Browse Projects

1. Click **"Projects"** in the sidebar
2. You should see 3 project cards:
   - **Smart ERP System** (Enterprise Application - In Progress)
   - **IoT Monitoring Dashboard** (IoT & Automation - In Progress)
   - **Mobile Attendance App** (Mobile Development - Completed)

3. **Click on "Smart ERP System"**
4. You'll see the project detail page with:
   - Project description
   - Status badges
   - 3 documentation entries

5. **Try the filters:**
   - Filter by Category: "Enterprise Application"
   - Filter by Status: "In Progress"

### Test 2: View Documentation

1. From the **Smart ERP System** project detail page
2. You should see 3 documentation:
   - Setup Database PostgreSQL untuk ERP (45 views)
   - Desain UI/UX Dashboard ERP (78 views)
   - Implementasi Module Purchasing (34 views)

3. **Click on any documentation** to view details
4. Notice the view count increases each time you open it

### Test 3: Check Daily Logbook

1. Click **"Logbook"** in the sidebar
2. You should see 5 logbook entries from different dates
3. **Filter by Year:** Select "2024"
4. **Filter by Month:** Select "February"

5. **Review the entries:**
   - Each entry shows the date, author, activity description
   - Some entries have image attachments
   - Hours spent is tracked

**Example entry (Feb 12, 2024):**
> Testing modul purchasing di ERP, berhasil implement PO creation dan approval workflow. Menemukan bug di calculation total harga saat ada diskon item.
> - 6.5 hours spent
> - 2 image attachments

### Test 4: Review Error Reports

1. Click **"Error Reports"** in the sidebar
2. You should see 4 error reports with different statuses:
   - **Solved:** Login Error - Session Timeout Too Fast
   - **In Progress:** Dashboard Chart Tidak Muncul di Browser Firefox
   - **In Progress:** MQTT Connection Drop pada Sensor 3
   - **Pending:** Upload Gambar Gagal untuk File > 2MB

3. **Try the filters:**
   - Filter by Status: "Solved" → Should show 1 report
   - Filter by Severity: "High" → Should show 1 report

4. **Click on the Solved error** to see:
   - Before image (error screenshot)
   - After images (solution screenshots)
   - Solution description in green box

### Test 5: Test Viewer Role (Read-Only)

1. **Logout** (click logout button in navbar)
2. **Login as Viewer:**
   - Username: `budi.viewer`
   - Password: `password123`

3. **Notice the differences:**
   - ❌ No "+ New Project" button
   - ❌ No "+ New Entry" button
   - ❌ No "+ Report Error" button
   - ❌ No "Edit" buttons anywhere
   - ✅ Can view all content (read-only)

4. **Test access control:**
   - Browse projects → ✅ Can view
   - View documentation → ✅ Can view
   - Check logbook → ✅ Can view
   - View error reports → ✅ Can view
   - Try to create/edit anything → ❌ No buttons available

### Test 6: Test as Different R&D User

1. **Logout** and login as:
   - Username: `siti.rnd`
   - Password: `password123`

2. **Notice:**
   - Full R&D access (can see all create/edit buttons)
   - Name displayed in navbar: "Siti Nurhaliza"
   - Role badge shows "R&D"

---

## 📊 Mock Data Summary

### Users Created
| Username | Password | Role | Full Name |
|----------|----------|------|-----------|
| ahmad.rnd | password123 | R&D | Ahmad Rizki |
| siti.rnd | password123 | R&D | Siti Nurhaliza |
| budi.viewer | password123 | Viewer | Budi Santoso |

### Projects Created
| Project Name | Category | Status | Docs | Created By |
|--------------|----------|--------|------|------------|
| Smart ERP System | Enterprise Application | In Progress | 3 | Ahmad |
| IoT Monitoring Dashboard | IoT & Automation | In Progress | 3 | Siti |
| Mobile Attendance App | Mobile Development | Completed | 1 | Ahmad |

### Logbook Entries
- **5 entries** from Feb 9-12, 2024
- Activities include: ERP testing, IoT sensor setup, meetings, debugging
- Total hours tracked: 30 hours
- Multiple image attachments

### Error Reports
- **1 Solved:** Session timeout issue (Medium severity)
- **2 In Progress:** Firefox chart bug (High), MQTT connection (Medium)
- **1 Pending:** File upload size limit (Low)

---

## 🔄 Resetting Mock Data

If you want to start fresh and reload the mock data:

### Option 1: Quick Reset (Keep Structure)
```bash
# Delete all data but keep tables
psql -d rndhub -c "TRUNCATE users, projects, documentation, logbook_entries, error_reports, media_files, activity_log RESTART IDENTITY CASCADE;"

# Reload schema and seed
psql -d rndhub -f database/schema.sql
psql -d rndhub -f database/seed.sql
```

### Option 2: Full Reset (Recreate Everything)
```bash
# Drop and recreate database
dropdb rndhub
createdb rndhub

# Reload schema and seed
psql -d rndhub -f database/schema.sql
psql -d rndhub -f database/seed.sql
```

---

## 🚨 Troubleshooting

### Problem: "database 'rndhub' does not exist"
**Solution:**
```bash
createdb rndhub
```

### Problem: "password authentication failed"
**Solution:** Update `backend/.env` with correct PostgreSQL credentials:
```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/rndhub
```

### Problem: "Port 3000 already in use"
**Solution:** 
- Kill the process using port 3000
- Or change `PORT=3001` in `backend/.env`

### Problem: Frontend shows blank page
**Solution:**
- Check browser console for errors
- Verify backend is running on port 3000
- Check `frontend/.env` has correct API URL

### Problem: "Cannot connect to API"
**Solution:**
- Verify backend server is running
- Check `VITE_API_URL` in `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```
- Restart frontend dev server after changing .env

### Problem: Images don't load (404 errors)
**Note:** The mock data references image URLs that don't actually exist. This is normal for testing. To see real images:
- Use the upload feature to add actual images
- Or create placeholder images in the `uploads/` directory

---

## ✨ Next Steps

Now that you have the system running with mock data:

1. **Experiment with the UI:**
   - Try filtering and searching
   - Navigate between pages
   - Test responsive design (resize browser)

2. **Add Your Own Data:**
   - Create a new project as R&D user
   - Add documentation entries
   - Create logbook entries
   - Report new errors

3. **Test Features:**
   - File upload (if you implement the modal)
   - Rich text editing
   - Date filtering
   - Status updates

4. **Customize:**
   - Modify the UI styles in `frontend/src/index.css`
   - Add more mock data to `database/seed.sql`
   - Extend API with new features

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Implementation Details:** See `implementation_plan.md`
- **Quick Start:** See `QUICKSTART.md`
- **Database Schema:** See `database/schema.sql`

---

## 🎉 You're All Set!

You now have a fully functional R&D Hub with realistic mock data. The system demonstrates:
- ✅ Role-based access control
- ✅ Project and documentation management
- ✅ Daily activity logging
- ✅ Error tracking with before/after comparison
- ✅ Multi-user collaboration

**Happy testing!** 🚀

---

**Need Help?**
- Check the troubleshooting section above
- Review the console logs in both terminals
- Verify all services are running
- Check browser developer tools for errors
