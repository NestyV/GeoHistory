# GeoHistory Refactoring Implementation Plan

*Generated: 2026-06-25*

**Purpose**: Step-by-step guide to execute the refactoring based on the specifications (Constitution, Security, Features, Design, Operations).

**Duration**: Estimated 6-8 weeks for full refactor + 2 weeks for testing.

---

## Current Contract Decisions Required

The plan describes the target refactor and is not proof that a task is implemented. Before work that depends on one of the following contracts, choose the intended target and align the code, tests, schema, and specifications in one scoped change:

| Contract | Current conflict | Required decision |
|----------|------------------|-------------------|
| Roles | `db/schema.sql` permits `regular` and `super_user`; Security and product guidance describe `user`, `curator`, and `super_user`. | Confirm the production role set and migration path. |
| Authorization | The legacy design document grants operations to different roles than Security. | Confirm the permission matrix to enforce. |
| Token endpoints | Documents refer to both `/api/auth/refresh` and `/api/auth/refresh-token`. | Confirm the public API contract and update callers/tests together. |
| Health endpoint | Historical docs mention both `/health` and `/api/health`. | Confirm the supported route and update operational checks. |

Until resolved, agents must report the relevant conflict rather than guessing, changing schema, or adding compatibility behavior during unrelated tasks.

---

## Overview

This plan breaks down the refactoring into **5 phases**, each with specific deliverables, testing criteria, and success metrics.

**Phase structure**:
1. **Setup & Cleanup** (1 week) — Prepare environment, remove technical debt
2. **Backend Modularization** (2 weeks) — Refactor monolithic server.js
3. **Frontend Refactoring** (1.5 weeks) — Consolidate components, add error boundaries
4. **Security Hardening** (1 week) — Implement auth improvements, rate limiting
5. **Testing & Documentation** (2 weeks) — Comprehensive testing, finalize docs

---

## Phase 1: Setup & Cleanup (Week 1)

### 1.1 Project Structure Refactoring

**Goal**: Reorganize files per [Constitution.md § 4.1](specs/Constitution.md#41-root-level-organization)

**Tasks**:
- [ ] Create `backend/src/` directory structure
  ```
  backend/src/
    ├── index.ts           (entry point)
    ├── routes/            (route handlers)
    ├── services/          (business logic)
    ├── repositories/      (data access)
    ├── middleware/        (Express middleware)
    ├── types/             (TypeScript definitions)
    ├── config/            (configuration)
    ├── utils/             (utilities)
  ```
- [ ] Create `app/components/common/` (atomic components)
- [ ] Create `app/components/features/` (feature components)
- [ ] Create `app/components/layout/` (layout components)
- [ ] Create `app/components/admin/` (admin-specific)
- [ ] Create `app/types/` for centralized type definitions

**Acceptance Criteria**:
- Directory structure matches Constitution.md
- File organization matches naming conventions
- No "src" subdirectory inside components (flat structure for pages)

---

### 1.2 Cleanup Technical Debt

**Goal**: Remove backup files, duplicate components, and legacy provider references.

**Tasks**:
- [ ] Remove backup files
  ```bash
  rm app/components/Map.tsx.bkp
  rm app/components/Map.tsx.bkp.tsx
  rm app/components/AdminNav_backup.tsx
  rm backend/server.js.backup*
  rm app/admin/events/page_backup.tsx
  ```
- [ ] Remove database.ts references (deprecated in favor of repositories)
  ```bash
  grep -r "from '@/lib/database'" app/
  # Replace with API calls or repository pattern
  ```
- [ ] Update [.github/copilot-instructions.md](../.github/copilot-instructions.md)
  - [ ] Replace all legacy provider references with PostgreSQL
  - [ ] Remove old SQL policies (replaced by backend validation)
  - [ ] Document new backend architecture

**Acceptance Criteria**:
- No .backup, .bkp, or _backup files remain
- No duplicate components
- copilot-instructions.md reflects current architecture

---

### 1.3 Environment Setup per Operations.md § 1

**Goal**: Ensure local development environment works per [Operations.md § 1.2-1.4](specs/Operations.md#12-initial-setup-steps)

**Tasks**:
- [ ] Create `.env.example` with all required variables (from [Operations.md § 1.3](specs/Operations.md#13-environment-variables-sensitive-file))
  ```env
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/geohistory
  JWT_SECRET=your-super-secret-key-must-be-min-32-chars
  JWT_REFRESH_SECRET=your-refresh-secret-must-be-min-32-chars
  # ... all others
  ```
- [ ] Verify docker-compose.yml matches [Operations.md § 1.4](specs/Operations.md#14-docker-compose-configuration)
- [ ] Update startup scripts in package.json
  ```json
  {
    "scripts": {
      "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
      "dev:frontend": "next dev",
      "dev:backend": "cd backend && npm run dev",
      "db:reset": "...",
      "db:seed": "..."
    }
  }
  ```
- [ ] Test fresh clone setup
  ```bash
  # From clean directory
  git clone <repo>
  cp .env.example .env
  docker-compose up -d
  npm install
  npm run dev
  # Should work in < 10 minutes
  ```

**Acceptance Criteria**:
- Fresh clone works from `npm install` → `npm run dev`
- All containers healthy
- Frontend loads at localhost:3000
- Backend responds at localhost:3001/api/health

---

### 1.4 TypeScript Configuration

**Goal**: Stricter type checking per [Constitution.md](specs/Constitution.md)

**Tasks**:
- [ ] Update `tsconfig.json`
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "exactOptionalPropertyTypes": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitThis": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "paths": {
        "@/*": ["./app/*"],
        "@/backend/*": ["./backend/src/*"]
      }
    }
  }
  ```
- [ ] Create `backend/tsconfig.json` (separate from frontend)

**Acceptance Criteria**:
- No TypeScript errors in current codebase
- `tsc --noEmit` passes without warnings

---

### 1.5 Phase 1 Testing

**Verification**:
- [ ] Directory structure audit
  ```bash
  tree -L 2 app/components/
  tree -L 2 backend/src/
  ```
- [ ] No backup files remain
  ```bash
  find . -name "*backup*" -o -name "*bkp*"
  # Should return only docs/adr/ or specs/ (none in src)
  ```
- [ ] Fresh setup works
  ```bash
  docker-compose down -v
  docker-compose up -d && sleep 10
  npm install && npm run dev
  # Visit http://localhost:3000
  ```

---

## Phase 2: Backend Modularization (Weeks 2-3)

### 2.1 Create Backend Service Layer

**Goal**: Extract business logic from routes into services per [Constitution.md § 5.3](specs/Constitution.md#53-feature-development-workflow)

**Tasks**:

#### 2.1.1 Auth Service
- [ ] Create `backend/src/services/AuthService.ts`
  - [ ] `register(email, password)` — validate & hash password
  - [ ] `login(email, password)` — verify credentials
  - [ ] `verifyToken(token)` — decode JWT
  - [ ] `generateAccessToken(userId)` — create access token
  - [ ] `generateRefreshToken(userId)` — create refresh token
  - [ ] `revokeRefreshToken(tokenId)` — add to blacklist

**Source**: [Security.md § 1.1](specs/Security.md#11-authentication--authorization-model)

#### 2.1.2 Event Service
- [ ] Create `backend/src/services/EventService.ts`
  - [ ] `createEvent(userId, eventData)` — validate, insert
  - [ ] `approveEvent(eventId, curatorId)` — set status to approved
  - [ ] `rejectEvent(eventId, reason)` — set status to rejected
  - [ ] `updateEvent(eventId, userId, eventData)` — allow creator to edit pending

**Source**: [Features.md § 2.1](specs/Features.md#21-event-management-workflow)

#### 2.1.3 Character Service
- [ ] Create `backend/src/services/CharacterService.ts`
  - [ ] `getCharacter(id)` — fetch with linked events
  - [ ] `createCharacter(characterData)` — curator/super_user only
  - [ ] `updateCharacter(id, data)` — curator/super_user only

#### 2.1.4 Permission Service
- [ ] Create `backend/src/services/PermissionService.ts`
  - [ ] `canApproveEvent(userId)` — check if curator/super_user
  - [ ] `canEditEvent(userId, eventId)` — check if creator or curator
  - [ ] `canManageUsers(userId)` — check if super_user
  - [ ] `hasRole(userId, role)` — check user role

**Source**: [Security.md § 1.2](specs/Security.md#12-authorization-permission-checking)

---

### 2.2 Create Repository Layer

**Goal**: Encapsulate all database queries per [Constitution.md § 2.2](specs/Constitution.md#22-layer-responsibilities)

**Tasks**:

#### 2.2.1 Base Repository
- [ ] Create `backend/src/repositories/BaseRepository.ts`
  ```typescript
  abstract class BaseRepository<T> {
    async findById(id: string): Promise<T | null>
    async findAll(limit = 100, offset = 0): Promise<T[]>
    async insert(data: any): Promise<T>
    async update(id: string, data: any): Promise<T>
    async delete(id: string): Promise<void>
  }
  ```

#### 2.2.2 Specialized Repositories
- [ ] `EventRepository` — events queries
  - [ ] `findByStatus(status)` — list by status
  - [ ] `findByYear(minYear, maxYear)` — filter by date
  - [ ] `updateStatus(eventId, status)` — approve/reject
- [ ] `UserRepository` — users queries
  - [ ] `findByEmail(email)` — login
  - [ ] `updateRole(userId, role)` — admin
- [ ] `CharacterRepository` — characters queries
  - [ ] `findByEvent(eventId)` — linked characters

**Acceptance Criteria**:
- All database access goes through repositories
- No raw SQL in services
- All queries parameterized (prevent SQL injection)

---

### 2.3 Refactor Routes into Modular Files

**Goal**: Split `backend/server.js` into route handlers per [Constitution.md § 4.1](specs/Constitution.md#41-root-level-organization)

**Current**: Single `server.js` file with ~600 lines

**New structure**:
```
backend/src/routes/
  ├── auth.ts       (login, register, refresh, logout)
  ├── events.ts     (CRUD, approve/reject)
  ├── characters.ts (CRUD)
  ├── places.ts     (CRUD)
  ├── admin.ts      (pending-events, users)
  └── health.ts     (health check)
```

**Tasks**:
- [ ] Create `backend/src/routes/auth.ts`
  ```typescript
  import express from 'express';
  import { AuthService } from '../services/AuthService';
  import { validateInput } from '../middleware/validation';
  
  const router = express.Router();
  
  router.post('/login', validateInput('email', 'password'), async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthService.login(
      req.body.email,
      req.body.password
    );
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.json({ user, accessToken });
  });
  
  // ... other endpoints
  export default router;
  ```
- [ ] Create `backend/src/routes/events.ts` (similar pattern)
- [ ] Create `backend/src/routes/characters.ts`
- [ ] Create `backend/src/routes/places.ts`
- [ ] Create `backend/src/routes/admin.ts`
- [ ] Create `backend/src/index.ts` (entry point)
  ```typescript
  import authRoutes from './routes/auth';
  import eventRoutes from './routes/events';
  import characterRoutes from './routes/characters';
  
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/characters', characterRoutes);
  ```

**Source**: [Features.md § 3](specs/Features.md#3-api-specification)

---

### 2.4 Create Middleware

**Goal**: Implement auth, error handling, logging per [Constitution.md § 2.2](specs/Constitution.md#22-layer-responsibilities)

**Tasks**:
- [ ] `backend/src/middleware/auth.ts` — JWT verification
  ```typescript
  export function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const user = verifyToken(token);
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
  ```
- [ ] `backend/src/middleware/errorHandler.ts` — global error catching [Operations.md § 4.3](specs/Operations.md#43-error-middleware)
- [ ] `backend/src/middleware/validation.ts` — input validation
- [ ] `backend/src/middleware/logging.ts` — request/response logging per [Operations.md § 3.1](specs/Operations.md#31-backend-logging)
- [ ] `backend/src/middleware/rateLimit.ts` — rate limiting per [Security.md § 4](specs/Security.md#4-rate-limiting--dos-protection)

---

### 2.5 Create Error Classes

**Goal**: Standardized error handling per [Operations.md § 4.2](specs/Operations.md#42-custom-error-classes)

**Tasks**:
- [ ] Create `backend/src/utils/errors.ts`
  ```typescript
  export class ValidationError extends AppError { ... }
  export class NotFoundError extends AppError { ... }
  export class PermissionError extends AppError { ... }
  ```

**Acceptance Criteria**:
- All services throw custom errors
- All routes catch and format errors
- Global middleware returns standardized JSON

---

### 2.6 Phase 2 Testing

**Verification**:
- [ ] All API endpoints still work
  ```bash
  curl http://localhost:3001/api/health
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "password"}'
  ```
- [ ] Modular structure verified
  ```bash
  find backend/src/routes -name "*.ts" | wc -l
  # Should show 6+ route files
  ```
- [ ] No functionality lost (manual smoke test)
  - [ ] Login/register works
  - [ ] Create event works
  - [ ] Approve event works (as curator)
  - [ ] View map and timeline works

---

## Phase 3: Frontend Refactoring (Weeks 4-4.5)

### 3.1 Component Organization

**Goal**: Reorganize components per [Design.md § 2.1](specs/Design.md#21-component-organization)

**Tasks**:
- [ ] Move existing components to correct folders
  ```
  app/components/common/
    ├── Button.tsx
    ├── Input.tsx
    ├── Modal.tsx
    ├── Card.tsx
    ├── Skeleton.tsx
    └── Alert.tsx
  
  app/components/features/
    ├── Map.tsx (consolidated)
    ├── EventForm.tsx
    ├── Timeline.tsx
    ├── EventCard.tsx
    └── CharacterList.tsx
  
  app/components/layout/
    ├── Navbar.tsx
    └── AdminNav.tsx
  
  app/components/admin/
    ├── EventReviewPanel.tsx
    └── UserManagementTable.tsx
  ```
- [ ] Create barrel exports `app/components/index.ts`
  ```typescript
  export { Button } from './common/Button';
  export { Map } from './features/Map';
  export { Navbar } from './layout/Navbar';
  ```

**Acceptance Criteria**:
- No duplicate components (Map.tsx only)
- All imports use barrel exports
- Component folder structure matches Design.md

---

### 3.2 Implement Error Boundary

**Goal**: Catch React errors per [Design.md § 6.1](specs/Design.md#61-global-error-boundary)

**Tasks**:
- [ ] Create `app/components/common/ErrorBoundary.tsx`
- [ ] Wrap root layout
  ```typescript
  // app/layout.tsx
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <ErrorBoundary>
            <Navbar />
            <main>{children}</main>
          </ErrorBoundary>
        </body>
      </html>
    );
  }
  ```

---

### 3.3 Add Loading States & Skeletons

**Goal**: Improve UX per [Design.md § 6.2](specs/Design.md#62-loading-skeleton-pattern)

**Tasks**:
- [ ] Create skeleton components for each feature
  - [ ] `EventSkeleton.tsx` — while events loading
  - [ ] `CharacterSkeleton.tsx` — while characters loading
- [ ] Update Map, EventForm, Timeline to show skeletons during load

---

### 3.4 Create Centralized Type Definitions

**Goal**: Single source of truth for types per [Constitution.md § 4.2](specs/Constitution.md#42-naming-conventions)

**Tasks**:
- [ ] Create `app/types/index.ts`
  ```typescript
  export interface User {
    id: string;
    email: string;
    role: 'user' | 'curator' | 'super_user';
  }
  
  export interface Event {
    id: string;
    user_id: string;
    title: string;
    // ... all fields
  }
  
  export interface Character { ... }
  export interface Place { ... }
  ```
- [ ] Update all components to import from `@/types`

---

### 3.5 Accessibility Improvements

**Goal**: WCAG 2.1 AA compliance per [Design.md § 7](specs/Design.md#7-accessibility-requirements-wcag-21-aa)

**Tasks**:
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Check color contrast ratios

---

### 3.6 Phase 3 Testing

**Verification**:
- [ ] Component structure matches Design.md
- [ ] Map and timeline still work
- [ ] No console errors
- [ ] Accessibility check (axe DevTools)

---

## Phase 4: Security Hardening (Week 5)

### 4.1 Implement JWT Refresh Token Flow

**Goal**: Secure token handling per [Security.md § 1.1](specs/Security.md#11-authentication--authorization-model)

**Backend Tasks**:
- [ ] Implement access token (15-min expiry)
- [ ] Implement refresh token (7-day expiry)
- [ ] Store refresh tokens in `refresh_tokens` table (with revocation logic)
- [ ] `POST /api/auth/refresh-token` endpoint
- [ ] Token rotation: each refresh returns new refresh token

**Frontend Tasks**:
- [ ] Store tokens in memory (access) and httpOnly cookie (refresh)
- [ ] Auto-refresh when access token expires
- [ ] Handle 401 by refreshing and retrying

---

### 4.2 Implement Rate Limiting

**Goal**: Protect endpoints from abuse per [Security.md § 4](specs/Security.md#4-rate-limiting--dos-protection)

**Tasks**:
- [ ] Install `express-rate-limit`
- [ ] Add rate limiter middleware
  - [ ] 100 requests/15 min per IP (general)
  - [ ] 10 requests/15 min per user (event creation)
  - [ ] 10 requests/15 min per IP (login)

---

### 4.3 Add Security Headers

**Goal**: Protect against XSS, clickjacking per [Security.md § 6.2](specs/Security.md#62-security-headers-to-implement)

**Tasks**:
- [ ] Add CORS headers
- [ ] Add `Strict-Transport-Security`
- [ ] Add `X-Content-Type-Options: nosniff`
- [ ] Add `X-Frame-Options: DENY`

---

### 4.4 Input Validation Hardening

**Goal**: Prevent injection attacks per [Security.md § 3.1](specs/Security.md#31-input-validation-backend)

**Tasks**:
- [ ] Implement validation rules from [Features.md § 3 (Error Responses)](specs/Features.md#5-error-responses)
- [ ] Validate all endpoints: events, characters, places
- [ ] Sanitize HTML in event descriptions (if allowed)

---

### 4.5 Audit Logging

**Goal**: Track security events per [Operations.md § 3.1](specs/Operations.md#31-backend-logging)

**Tasks**:
- [ ] Log login attempts (success & failure)
- [ ] Log event approvals
- [ ] Log user role changes
- [ ] Log API errors (4xx, 5xx)
- [ ] Never log passwords or full tokens

---

### 4.6 Phase 4 Testing

**Verification**:
- [ ] JWT refresh token flow works
- [ ] Rate limit triggers (test with wrk or ab)
- [ ] Security headers present (check with curl -I)
- [ ] Audit logs generated on actions

---

## Phase 5: Testing & Documentation (Weeks 6-7)

### 5.1 Unit Testing Backend

**Goal**: Test services and repositories

**Tasks**:
- [ ] Set up Jest in `backend/`
- [ ] Write tests for AuthService
- [ ] Write tests for EventService
- [ ] Write tests for PermissionService
- [ ] Aim for 80%+ code coverage

---

### 5.2 Integration Testing

**Goal**: Test API endpoints end-to-end

**Tasks**:
- [ ] Test auth flow (register, login, refresh, logout)
- [ ] Test event CRUD (create, read, update, approve)
- [ ] Test permissions (curator can't do super_user actions)
- [ ] Test error responses match [Features.md § 5](specs/Features.md#5-error-responses)

---

### 5.3 Frontend Testing

**Goal**: Test components and hooks

**Tasks**:
- [ ] Set up React Testing Library
- [ ] Test EventForm submission
- [ ] Test Map interaction
- [ ] Test permission-based UI (admin panel hidden for non-admins)

---

### 5.4 Documentation Updates

**Tasks**:
- [ ] Update [README.md](README.md)
  - [ ] Remove legacy provider references
  - [ ] Add new backend setup steps
  - [ ] Update architecture diagram
- [ ] Create ADRs (Architecture Decision Records)
  - [ ] ADR 0001: JWT Refresh Token Strategy
  - [ ] ADR 0002: Modular Backend (vs monolithic)
  - [ ] ADR 0003: Repository Pattern (vs ORM)
- [ ] Update [.github/copilot-instructions.md](.github/copilot-instructions.md)
  - [ ] Link to specs/
  - [ ] Document new patterns (services, repositories)
  - [ ] Update database setup instructions

---

### 5.5 Performance Optimization

**Tasks**:
- [ ] Database query optimization
  - [ ] Add indexes (from [db/schema.sql](db/schema.sql))
  - [ ] Verify no N+1 queries
  - [ ] Test with slow network (DevTools throttle)
- [ ] Frontend bundle size
  - [ ] Run `next build` and check size
  - [ ] Add code splitting for admin routes
- [ ] API response times
  - [ ] Ensure < 500ms for typical queries

---

### 5.6 Final Verification

**Checklist**:
- [ ] All API endpoints working per [Features.md § 3](specs/Features.md#3-api-specification)
- [ ] All permission checks enforced per [Security.md § 1.2](specs/Security.md#12-authorization-permission-checking)
- [ ] Error responses standardized per [Features.md § 5](specs/Features.md#5-error-responses)
- [ ] Logging working per [Operations.md § 3.1](specs/Operations.md#31-backend-logging)
- [ ] Frontend matches [Design.md](specs/Design.md) patterns
- [ ] Tests passing (unit, integration, e2e)
- [ ] Documentation complete

---

## Success Metrics

### Code Quality
- **TypeScript errors**: 0
- **eslint warnings**: < 5
- **Test coverage**: > 80%
- **Code duplication**: < 5%

### Performance
- **Page load**: < 2 seconds
- **API response**: < 500ms (p95)
- **Bundle size**: < 500KB (gzipped)

### Security
- **OWASP compliance**: 10/10 items addressed
- **Rate limiting**: Working on all endpoints
- **Audit logging**: All security events logged

### Developer Experience
- **Setup time**: < 10 minutes (from clean clone)
- **Time to add feature**: < 4 hours (with templates)
- **Documentation**: Complete per spec standards

---

## Rollback Plan

If issues arise during refactoring:

1. **Preserve original**
   ```bash
   git checkout -b backup-original
   git commit -m "Backup original before refactor"
   ```

2. **Work on feature branch**
   ```bash
   git checkout -b refactor/backend-modularization
   # ... work here
   ```

3. **If critical failure**
   ```bash
   git reset --hard backup-original
   git push origin backup-original
   ```

---

## Communication & Handoff

### During Refactoring
- Daily standup (if team): 15 min
- Code review before merge: 2+ reviewers
- Test thoroughly before commit

### After Refactoring
- **Team training**: Show new architecture (1 hour)
- **Documentation**: Ensure all specs are accessible
- **Templates**: Provide examples for new features
- **Runbook**: How to debug common issues

---

## Cross-Reference to Specs

- **Constitution.md**: Architecture decisions guide all phases
- **Security.md**: Security.md § 4 covers rate limiting; § 1 covers JWT
- **Features.md**: Defines all API endpoints implemented in Phase 2
- **Design.md**: Component patterns implemented in Phase 3
- **Operations.md**: Testing and deployment in Phases 5-6

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1: Setup & Cleanup | 1 week | Project structure, cleaned backups, working environment |
| 2: Backend Modularity | 2 weeks | Services, repositories, modular routes |
| 3: Frontend Refactor | 1.5 weeks | Organized components, error boundaries, types |
| 4: Security | 1 week | JWT refresh, rate limiting, security headers |
| 5: Testing & Docs | 2 weeks | Tests, documentation, performance optimization |
| **Total** | **7.5 weeks** | **Production-ready refactored system** |

---

## Next Steps

1. **Review this plan** with team
2. **Assign owners** to each phase
3. **Create PRs** per phase with linked spec sections
4. **Merge sequentially** (don't merge phase 2 before phase 1 complete)
5. **Deploy to staging** after phase 4
6. **Dogfood & test** in staging for 1 week
7. **Deploy to production** after final testing

---

