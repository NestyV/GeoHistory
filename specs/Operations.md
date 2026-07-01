# GeoHistory Operations Specification

*Last Updated: 2026-06-25*

**Related Specs**: [Constitution.md](Constitution.md) defines tech stack; [Security.md](Security.md) covers audit logging; [Features.md](Features.md) documents API contracts; [Design.md](Design.md) covers performance patterns.

---

## 1. Development Environment Setup

### 1.1 Prerequisites

- **Windows**: WSL 2 (Windows Subsystem for Linux)
- **WSL Distro**: Ubuntu 20.04 LTS or later
- **Docker Desktop**: Latest (enables WSL 2 integration)
- **Git**: Latest
- **Node.js**: 18 LTS or later (installed in WSL)

### 1.2 Initial Setup Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd GeoHistory

# 2. Copy environment template
cp .env.example .env

# 3. Start Docker containers
docker-compose up -d

# 4. Wait for PostgreSQL to be ready
sleep 5

# 5. Initialize database schema
docker-compose exec db psql -U postgres -d geohistory < db/schema.sql

# 6. Install Node dependencies
npm install

# 7. Start development server
npm run dev
```

**Verification**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

### 1.3 Environment Variables (.env file)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/geohistory
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=geohistory

# Backend
NODE_ENV=development
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-key-must-be-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-must-be-min-32-chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

**Security Note**: Never commit `.env` to git. Use `.env.example` as template only.

### 1.4 Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    container_name: geohistory-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: geohistory
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: geohistory-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@db:5432/geohistory
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app/backend
      - /app/backend/node_modules
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: geohistory-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./app:/app/app
      - /app/node_modules

volumes:
  postgres_data:
```

### 1.5 Database Initialization

**File**: `db/schema.sql`

Contains all table definitions and indexes. Applied on first setup:

```bash
docker-compose exec db psql -U postgres -d geohistory < db/schema.sql
```

For future schema changes:
1. Update `db/schema.sql`
2. Drop and recreate database:
   ```bash
   docker-compose exec db psql -U postgres -c "DROP DATABASE geohistory;"
   docker-compose exec db psql -U postgres -c "CREATE DATABASE geohistory;"
   docker-compose exec db psql -U postgres -d geohistory < db/schema.sql
   ```
3. Seed test data if needed:
   ```bash
   docker-compose exec db psql -U postgres -d geohistory < db/seeds/dev.sql
   ```

---

## 2. Build & Deployment Pipeline

### 2.1 Local Development Build

```bash
# Start dev server (watches for changes)
npm run dev

# This runs:
# - Next.js frontend on http://localhost:3000 (HMR enabled)
# - Express backend on http://localhost:3001 (auto-reload on file changes)
```

### 2.2 Production Build

```bash
# Build frontend (Next.js)
npm run build

# Build backend (TypeScript compilation - future)
cd backend && npm run build

# Outputs:
# - frontend: .next/ (optimized, ready to serve)
# - backend: dist/ (compiled JavaScript)
```

### 2.3 Docker Image Build

```bash
# Build images
docker build -f Dockerfile.frontend -t geohistory-frontend .
docker build -f Dockerfile.backend -t geohistory-backend .

# Or use docker-compose
docker-compose build --no-cache
```

**Frontend Dockerfile** (`Dockerfile.frontend`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Backend Dockerfile** (`Dockerfile.backend`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

COPY backend ./
EXPOSE 3001
CMD ["node", "server.js"]
```

### 2.4 Deployment to Server

**Prerequisites**: Server with Docker and docker-compose installed.

```bash
# 1. SSH to server
ssh user@server.com

# 2. Clone repository
git clone <repo-url>
cd GeoHistory

# 3. Set production environment variables
nano .env  # Update with production secrets

# 4. Pull latest code
git pull origin main

# 5. Start containers
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify health
curl http://localhost:3001/api/health
```

**Production docker-compose.prod.yml**:
```yaml
# Same as local, but:
# - Use production environment variables
# - Set NODE_ENV=production
# - Disable volumes (run images as-is)
# - Add reverse proxy (nginx) for HTTPS and routing
# - Add health checks
```

---

## 3. Logging & Monitoring

### 3.1 Backend Logging

**Structured JSON logging** (machine-readable, easy to parse):

```typescript
// backend/src/utils/logger.ts
export interface LogEntry {
  timestamp: string;        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;         // Component/module name
  requestId?: string;       // Correlate across requests
  userId?: string;          // For authenticated requests
  duration?: number;        // For performance tracking
  error?: string;           // Error message (not sensitive data)
  meta?: Record<string, any>; // Additional context
}

// Usage:
logger.info('Event created', {
  context: 'EventService',
  userId: req.user.id,
  requestId: req.id,
  meta: { eventId: event.id, status: event.status }
});

logger.error('Database error', {
  context: 'EventRepository',
  error: 'Connection timeout',
  meta: { query: 'SELECT * FROM events' }
});
```

**Log levels**:
- **debug**: Detailed information (disabled in production)
- **info**: General information (startup, user actions)
- **warn**: Warning conditions (rate limits, deprecated usage)
- **error**: Error conditions (exceptions, failed operations)

**What to log** (from [Security.md](Security.md#52-audit-logging)):
- Login attempts
- Event approvals/rejections
- User role changes
- Event deletions
- API errors (4xx, 5xx)

**What NOT to log**:
- Passwords
- JWT tokens
- Full email addresses
- Request/response bodies with sensitive data

### 3.2 Frontend Error Tracking

**Global error handler**:

```typescript
// app/lib/errorTracking.ts
export function captureException(error: Error, context?: string) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log to backend
  fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify(errorLog)
  }).catch(() => {
    // Silently fail if logging fails
    console.error('Error logging failed:', error);
  });
}

// React error boundary integration
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, `React Error Boundary: ${errorInfo.componentStack}`);
  }
}

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  captureException(event.reason, 'Unhandled Promise Rejection');
});
```

### 3.3 Monitoring & Alerts

**Health check endpoint** (no auth required):

```typescript
// GET /api/health
{
  "status": "ok" | "degraded" | "down",
  "timestamp": "2026-06-25T14:30:00Z",
  "database": "connected" | "disconnected",
  "checks": {
    "database": { status: "ok", responseTime: 45 },
    "disk_space": { status: "ok", available_gb: 250 },
    "memory": { status: "ok", usage_percent: 45 }
  }
}
```

**Monitoring (future)**:
- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for notifications

### 3.4 Log Retention

- **General logs**: 30 days
- **Security logs** (auth, approvals): 90 days
- **Error logs**: 60 days
- **Old logs**: Automatically archived to cold storage

---

## 4. Error Handling Standards

### 4.1 Backend Error Flow

```
1. Error occurs in route handler
   ↓
2. Catch and wrap in custom error class
   ↓
3. Pass to global error middleware
   ↓
4. Log error (sanitized, no sensitive data)
   ↓
5. Return standardized error response (HTTP status + error object)
```

### 4.2 Custom Error Classes

```typescript
// backend/src/utils/errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class PermissionError extends AppError {
  constructor(message?: string) {
    super(403, message || 'Permission denied', 'PERMISSION_DENIED');
  }
}

export class AuthenticationError extends AppError {
  constructor(message?: string) {
    super(401, message || 'Unauthorized', 'UNAUTHORIZED');
  }
}
```

### 4.3 Error Middleware

```typescript
// backend/src/middleware/errorHandler.ts

export function globalErrorHandler(
  err: Error | AppError,
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  // Log error
  logger.error('Unhandled error', {
    context: 'ErrorHandler',
    error: err.message,
    requestId: req.id,
    userId: req.user?.id,
    meta: { path: req.path, method: req.method }
  });

  // Return error response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Unknown error
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}
```

### 4.4 Frontend Error Handling

```typescript
// API call with error handling
async function fetchEvents() {
  try {
    setIsLoading(true);
    const data = await api.getEvents();
    setEvents(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      setError('Invalid request parameters');
    } else if (error instanceof AuthenticationError) {
      // Redirect to login
      router.push('/auth');
    } else {
      setError('Failed to load events. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
}
```

**User-facing error messages** (from [Operations.md](Operations.md#44-frontend-error-handling)):
- Clear, non-technical language
- Actionable (what should user do next?)
- Specific (not "An error occurred")

**Example**:
```
✗ "An error occurred"

✓ "Failed to approve event. Please check your permissions and try again."
✓ "Event title must be less than 200 characters."
✓ "Database connection lost. Your changes will be saved when connection is restored."
```

---

## 5. Performance Optimization

### 5.1 Database Query Optimization

**Indexes** (in `db/schema.sql`):
```sql
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_year ON events(year);
CREATE INDEX idx_characters_name ON characters(name);
```

**Query best practices**:
- Use SELECT specific columns (not `SELECT *`)
- Add LIMIT to list queries (default 100, max 1000)
- Use OFFSET for pagination (or cursor-based)
- Join only needed tables
- Avoid N+1 queries (fetch related data in batch)

**Example** (N+1 problem):
```typescript
// ✗ Bad: 101 queries (1 for events + 100 for each event's characters)
const events = await EventRepository.findAll();
for (const event of events) {
  event.characters = await CharacterRepository.findByEventId(event.id);
}

// ✓ Good: 2 queries
const events = await EventRepository.findAll();
const allCharacters = await CharacterRepository.findByEventIds(events.map(e => e.id));
const charactersByEventId = groupBy(allCharacters, 'event_id');
events.forEach(e => e.characters = charactersByEventId[e.id] || []);
```

### 5.2 API Response Caching

**Frontend caching strategy**:
- **Events list**: Cache for 5 minutes
- **Event detail**: Cache for 10 minutes
- **Characters/Places**: Cache for 1 hour
- **User profile**: Cache for session

```typescript
// lib/api.ts
const CACHE_TTL = {
  events: 5 * 60 * 1000,
  eventDetail: 10 * 60 * 1000,
  characters: 60 * 60 * 1000
};

const cache = new Map();

export async function getEvents() {
  const key = 'events';
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.time < CACHE_TTL.events) {
    return cached.data;
  }
  
  const data = await axios.get('/api/events');
  cache.set(key, { data, time: Date.now() });
  return data;
}

// Invalidate cache after mutation
export async function createEvent(event: Event) {
  const result = await axios.post('/api/events', event);
  cache.delete('events'); // Invalidate cache
  return result;
}
```

### 5.3 Frontend Bundle Size

**Code splitting** (lazy load heavy features):
```typescript
// app/admin/page.tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { loading: () => <div>Loading admin panel...</div> }
);

// AdminPanel code only loaded when admin page accessed
```

**Image optimization** (use Next.js Image):
```typescript
import Image from 'next/image';

<Image
  src={eventImage}
  alt="Event location"
  width={400}
  height={300}
  priority={false}
  onLoadingComplete={handleImageLoaded}
/>
```

### 5.4 Monitoring Performance

**Frontend metrics**:
```typescript
// app/lib/performance.ts
export function measurePageLoad() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const { loadEventEnd, navigationStart } = performance.timing;
    const pageLoadTime = loadEventEnd - navigationStart;
    console.log(`Page load time: ${pageLoadTime}ms`);
  }
}

// Track API response times
export async function trackAPICall(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`${name} took ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`${name} failed after ${duration}ms`);
    throw error;
  }
}
```

---

## 6. Local Development Workflow

### 6.1 npm Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "next dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "next build && cd backend && npm run build",
    "start": "next start",
    "test": "jest",
    "lint": "eslint app/ backend/src/",
    "format": "prettier --write .",
    "db:reset": "docker-compose exec db psql -U postgres -c \"DROP DATABASE geohistory; CREATE DATABASE geohistory;\" && docker-compose exec db psql -U postgres -d geohistory < db/schema.sql",
    "db:seed": "docker-compose exec db psql -U postgres -d geohistory < db/seeds/dev.sql",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

### 6.2 Development Tips

**Watch file changes and auto-reload**:
```bash
# Backend auto-reload (included in npm run dev)
# Uses nodemon to restart on changes

# Frontend HMR (Hot Module Replacement)
# Automatically reloads when you save files
```

**Debug backend**:
```bash
# VSCode launch configuration (.vscode/launch.json)
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach Backend",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}

# Run backend with debug port
node --inspect backend/server.js
```

**Debug frontend**:
- Open Chrome DevTools (F12)
- Debugger automatically breakpoints on errors

### 6.3 Testing Database

**Reset database to clean state**:
```bash
npm run db:reset
```

**Seed test data**:
```bash
npm run db:seed
```

**Connect to database directly**:
```bash
docker-compose exec db psql -U postgres -d geohistory

# Then run SQL:
\dt                    -- List tables
SELECT * FROM users;   -- View users
```

---

## 7. Documentation Requirements

### 7.1 README.md Structure

**Should include**:
1. Project description (1-2 paragraphs)
2. Features overview (bullet list)
3. Tech stack (table)
4. Installation (quick start)
5. Development (how to run locally)
6. Testing (how to run tests)
7. Deployment (how to deploy to production)
8. Contributing (code style, PR process)
9. License

### 7.2 Architecture Decision Records (ADRs)

**File**: `docs/adr/0001-use-jwt-for-authentication.md`

```markdown
# ADR 0001: Use JWT for Authentication

## Status
ACCEPTED

## Context
We need stateless authentication that works across multiple server instances.

## Decision
Use JWT (JSON Web Tokens) with refresh token rotation.

## Rationale
- Stateless: No session storage required
- Scalable: Works with multiple servers
- Standard: Well-supported across frameworks

## Consequences
- Token revocation requires token blacklist
- Token size increases response size
- Refresh token rotation adds complexity
```

### 7.3 API Documentation

**OpenAPI/Swagger** (optional, future):
```yaml
openapi: 3.0.0
info:
  title: GeoHistory API
  version: 1.0.0
paths:
  /api/events:
    get:
      summary: List events
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Events list
```

---

## 8. Security & Compliance

### 8.1 Secret Management

**Environment variables** (never commit):
```env
JWT_SECRET=...
DATABASE_PASSWORD=...
```

**Rotate secrets** (quarterly):
- Generate new JWT_SECRET
- Update all tokens
- Document change in changelog

### 8.2 Data Backup

**Daily backups** (future):
```bash
# Backup database to S3 or external storage
pg_dump geohistory | gzip > backup-$(date +%Y%m%d).sql.gz
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Solution |
|-------|----------|
| Docker containers won't start | `docker-compose logs` to see error; ensure ports 3000, 3001, 5432 not in use |
| Database connection refused | Wait 10s for PostgreSQL to start; check DATABASE_URL in .env |
| CORS errors | Check CORS middleware in backend; ensure frontend URL matches CORS_ORIGIN |
| Frontend won't build | Clear `node_modules`, run `npm install`, check Node version (18+) |
| Pending events not loading | Check user role is `curator` or `super_user` |

### 9.2 Useful Commands

```bash
# View all running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Connect to database
docker-compose exec db psql -U postgres -d geohistory

# Stop all containers
docker-compose down

# Remove all volumes (careful!)
docker-compose down -v
```

---

## 10. Cross-References

- [Constitution.md](Constitution.md#7-dependencies--constraints) — Tech constraints
- [Security.md](Security.md#52-audit-logging) — Audit logging requirements
- [Features.md](Features.md#5-error-responses) — API error formats

---

