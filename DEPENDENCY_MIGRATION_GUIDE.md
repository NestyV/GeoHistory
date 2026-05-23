# 📋 DEPENDENCY CLEANUP & MIGRATION GUIDE

## 🎯 Overview

This guide walks you through the complete migration from Supabase to a self-hosted setup with local PostgreSQL and a Node.js Express backend.

**What Changed:**
- ❌ Removed: @supabase/supabase-js (vulnerable)
- ✅ Added: Express.js backend
- ✅ Added: Self-hosted PostgreSQL
- ✅ Added: JWT-based authentication
- ✅ Updated: All dependencies to latest stable versions
- ✅ Added: Docker containerization

---

## 📊 STEP-BY-STEP SETUP

### **STEP 1: Pull the New Branch**

```bash
# Fetch and checkout the dependency-cleanup branch
git fetch origin
git checkout dependency-cleanup
```

---

### **STEP 2: Install Frontend Dependencies**

```bash
# Remove old lock file to ensure clean install
rm -f package-lock.json

# Install frontend dependencies (Next.js 15, React 19, etc.)
npm install
```

**What installs:**
- ✅ Next.js 15.0.0 (latest stable)
- ✅ React 19.0.0
- ✅ Leaflet 1.10.0 (map library)
- ✅ Axios 1.7.0 (API calls)
- ✅ TypeScript 5.5.2

**Installation time:** ~2-3 minutes

---

### **STEP 3: Install Backend Dependencies**

```bash
# Navigate to backend
cd backend

# Install Node.js dependencies
npm install

# Return to root
cd ..
```

**What installs:**
- ✅ Express 4.21.0 (API framework)
- ✅ PostgreSQL client (pg 8.11.3)
- ✅ JWT library (jsonwebtoken 9.1.2)
- ✅ Password hashing (bcryptjs 2.4.3)
- ✅ CORS support

**Installation time:** ~1-2 minutes

---

### **STEP 4: Setup Environment Files**

#### **Frontend Environment (.env.local)**

```bash
# Copy template
cp .env.local.example .env.local
```

**Content:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000
```

#### **Backend Environment (backend/.env)**

```bash
# Copy template
cp backend/.env.example backend/.env
```

**Edit backend/.env with secure values:**

```env
# Database Configuration
DB_HOST=postgres           # Use 'postgres' for Docker, 'localhost' for native
DB_PORT=5432
DB_NAME=geohistory
DB_USER=geohistory_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE  # 🔐 Change this!

# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECRET_KEY_MIN_32_CHARS  # 🔐 Change this!
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

⚠️ **IMPORTANT:** Replace placeholder values in backend/.env!

---

### **STEP 5: Option A - Start with Docker (RECOMMENDED)**

**Prerequisite:** Docker Desktop installed

```bash
# Build Docker images
npm run docker:build

# Start all services (PostgreSQL + Backend + Frontend)
npm run docker:up
```

**What happens:**
1. PostgreSQL container starts
2. Database initializes with schema from DATABASE_SETUP.sql
3. Backend connects to database
4. Frontend starts

**Access:**
- 🌐 Frontend: http://localhost:3000
- 📡 Backend API: http://localhost:3001
- 🗄️ Database: localhost:5432

**Stop services:**
```bash
npm run docker:down
```

---

### **STEP 5: Option B - Start Locally (Without Docker)**

**Prerequisites:**
- PostgreSQL installed locally
- Node.js 18+

#### **5B.1: Create PostgreSQL Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Run in psql terminal:
CREATE DATABASE geohistory;
CREATE USER geohistory_user WITH PASSWORD 'your_secure_password';
ALTER ROLE geohistory_user SET client_encoding TO 'utf8';
ALTER ROLE geohistory_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE geohistory_user SET default_transaction_deferrable TO on;
ALTER ROLE geohistory_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE geohistory TO geohistory_user;
\q
```

#### **5B.2: Initialize Database Schema**

```bash
# Connect to database and run schema
psql -U geohistory_user -d geohistory -f DATABASE_SETUP.sql
```

#### **5B.3: Update backend/.env**

```env
DB_HOST=localhost  # Change from 'postgres' to 'localhost'
DB_PORT=5432
DB_NAME=geohistory
DB_USER=geohistory_user
DB_PASSWORD=your_secure_password
```

#### **5B.4: Start Backend**

```bash
# Terminal 1: Start backend
cd backend
npm run dev
```

Expected output:
```
🚀 GeoHistory Backend running on port 3001
📝 API URL: http://localhost:3001
🗄️ Database: localhost:5432/geohistory
```

#### **5B.5: Start Frontend**

```bash
# Terminal 2: Start frontend
npm run dev
```

Expected output:
```
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
```

---

## ✅ VERIFICATION

### **Check Backend Health**

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status": "ok", "timestamp": "2026-05-23T20:15:00.000Z"}
```

### **Test Database Connection**

```bash
psql -U geohistory_user -d geohistory -c "SELECT COUNT(*) FROM users;"
```

**Expected output:**
```
 count
-------
     0
(1 row)
```

### **Test Signup Endpoint**

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "full_name": "Test User",
    "role": "regular"
  },
  "token": "eyJhbGc..."
}
```

---

## 🔧 TROUBLESHOOTING

### **PostgreSQL Connection Failed**

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
- Make sure PostgreSQL is running
- Docker: Check `docker ps` shows postgres container
- Local: Run `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)

### **Port Already in Use**

**Error:** `listen EADDRINUSE :::3001`

**Solution:**
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### **JWT Secret Too Short**

**Error:** `JWT_SECRET must be at least 32 characters`

**Solution:**
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update backend/.env with the output.

### **CORS Error in Frontend**

**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
- Check `CORS_ORIGIN` in backend/.env matches frontend URL
- For Docker: Use `http://localhost:3000`
- For localhost: Use `http://localhost:3000`

---

## 📚 API ENDPOINTS REFERENCE

### **Authentication**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### **Events**
- `GET /api/events` - Get all approved events (public)
- `GET /api/events/my` - Get user's events (auth required)
- `POST /api/events` - Create new event (auth required)
- `PATCH /api/events/:id/approve` - Approve event (super_user only)
- `DELETE /api/events/:id` - Delete event (super_user only)

### **Characters**
- `GET /api/characters` - Get all characters (public)
- `POST /api/characters` - Create character (auth required)

### **Frames**
- `GET /api/frames` - Get all historical frames (public)
- `POST /api/frames` - Create frame (super_user only)

### **Admin**
- `GET /api/admin/events/pending` - Get pending events (super_user only)

---

## 🚀 NEXT STEPS

1. ✅ Database running
2. ✅ Backend API running
3. ✅ Frontend running
4. ⏭️ **Update frontend API calls** - Replace Supabase calls with backend API calls
5. ⏭️ **Test authentication flow**
6. ⏭️ **Share URL with friends via ngrok**

---

## 🔐 SECURITY NOTES

1. **Never commit .env files** - They're in .gitignore (keep it that way)
2. **Change JWT_SECRET in production** - Use `crypto.randomBytes(32).toString('hex')`
3. **Use HTTPS in production** - Let's Encrypt + nginx
4. **Validate all inputs** - Already done in server.js
5. **Use strong database passwords** - Not "password123"!

---

## 📞 Need Help?

Check logs:
```bash
# Docker logs
docker logs geohistory-backend
docker logs geohistory-postgres

# Local logs
# Check terminal output for error messages
```

---

**Status:** ✅ Ready to start development!
