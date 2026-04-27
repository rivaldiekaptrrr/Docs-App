# Login Troubleshooting

## ✅ Backend API Working
All users can login successfully via API:
- `admin` / `password123` ✅
- `ahmad.rnd` / `password123` ✅  
- `siti.rnd` / `password123` ✅
- `budi.viewer` / `password123` ✅

## 🔍 If Login Fails in Browser

### Step 1: Clear Browser Cache & Storage
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear storage** or **Clear site data**
4. Check:
   - ✅ Local storage
   - ✅ Session storage
   - ✅ Cookies
5. Click **Clear site data**
6. **Hard refresh**: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)

### Step 2: Check Console for Errors
1. Open DevTools (F12)
2. Go to **Console** tab
3. Try to login
4. Look for red error messages
5. Common issues:
   - CORS errors
   - Network errors
   - 401 Unauthorized

### Step 3: Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Look for `/api/auth/login` request
5. Check:
   - Status code (should be 200)
   - Response (should contain token)
   - Request payload (username & password)

### Step 4: Verify API URL
Open browser console and run:
```javascript
console.log(import.meta.env.VITE_API_URL)
```
Should show: `http://localhost:3000/api`

### Step 5: Test API Directly
Open a new tab and go to:
```
http://localhost:3000/api/auth/login
```
Should show: `Cannot GET /api/auth/login` (this is normal, it needs POST)

## 🔧 Manual Test via Browser Console

Open browser console (F12) and paste:
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password123' })
})
.then(r => r.json())
.then(data => console.log('✅ Login success:', data))
.catch(err => console.error('❌ Login failed:', err))
```

If this works but the login form doesn't, there's an issue with the React component.

## 🚀 Quick Fix
1. Stop frontend server (Ctrl+C)
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules/.vite folder: `rm -rf node_modules/.vite`
4. Restart: `npm run dev`
5. Hard refresh browser: Ctrl+Shift+R
