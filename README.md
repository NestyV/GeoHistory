# GeoHistory

GeoHistory is a collaborative platform for mapping and browsing historical events across place and time. Users can submit events, and curator-level roles moderate and approve content before publication.

## Current Architecture

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet
- Backend: Express.js + TypeScript with modular routes, services, and repositories
- Database: PostgreSQL (Docker for local development)
- Auth model: JWT access + refresh token rotation with DB-backed refresh token persistence

## Repository Structure

- app: Next.js application
- backend/src: Express backend (routes, services, repositories, middleware)
- db: schema and database assets
- specs: architecture, security, design, feature, and operations specifications

## Prerequisites

- Node.js 18+
- npm 9+
- Docker and Docker Compose

## Local Development

1. Install dependencies

```bash
npm install
cd backend && npm install
cd ..
```

2. Create environment file

```bash
cp .env.example .env
```

3. Start infrastructure

```bash
docker-compose up -d
```

4. Initialize database schema

```bash
docker-compose exec postgres psql -U geohistory_user -d geohistory < db/schema.sql
```

5. Start applications

```bash
# Frontend + backend (single command)
npm run dev
```

6. Verify endpoints

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health

## Daily Startup Checklist

Use this sequence every time you start working or testing locally:

See [docs/RUNBOOK.md](docs/RUNBOOK.md) for the full reusable runbook.

1. Confirm prerequisites are running

```bash
docker-compose ps
```

2. Start the database and backend support services

```bash
docker-compose up -d
```

3. Start the application stack

```bash
npm run dev
```

4. Verify backend is healthy

```bash
curl http://localhost:3001/api/health
```

5. Open the frontend in the browser

- Frontend: http://localhost:3000

6. Run tests before and after changes

```bash
npm run test:frontend
cd backend && npm run test:integration
cd backend && npm run type-check
```

7. Stop services when finished

```bash
docker-compose down
```

## Useful Commands

- Frontend dev: npm run dev
- Frontend build: npm run build
- Frontend lint: npm run lint
- Backend dev: cd backend && npm run dev
- Backend type-check: cd backend && npm run type-check
- Docker up/down: npm run docker:up / npm run docker:down

## Environment Variables

Use .env.example as the source of truth. Key variables include:

- DATABASE_URL
- BACKEND_PORT
- NEXT_PUBLIC_API_URL
- JWT_SECRET
- JWT_REFRESH_SECRET

## Specifications

Project standards and planned refactor steps are in:

- specs/Constitution.md
- specs/Security.md
- specs/Features.md
- specs/Design.md
- specs/Operations.md
- specs/IMPLEMENTATION_PLAN.md

## Status

This codebase is in active refactoring. Core modular routes/services are now live and being validated against specs/IMPLEMENTATION_PLAN.md phase by phase.

## Versioned Change Log

### v0.2.1 - 2026-06-26

- Fixed malformed backend startup block in backend/src/index.ts that prevented TypeScript compilation.
- Removed legacy backup artifacts in backend and _backup directories.
- Updated root scripts so npm run dev starts both frontend and backend concurrently.
- Replaced outdated hosted-BaaS-focused README content with PostgreSQL + Docker + modular backend setup.

### v0.2.2 - 2026-06-26

- Added structured component folders and migration entry points:
	- app/components/common
	- app/components/features
	- app/components/layout
	- app/components/admin
- Added ErrorBoundary component at app/components/common/ErrorBoundary.tsx and wired it into app/layout.tsx.
- Added loading skeletons:
	- app/components/features/EventSkeleton.tsx
	- app/components/features/CharacterSkeleton.tsx
- Migrated page imports to structured component paths across map, timeline, and admin pages.
- Updated app/components/index.ts barrel exports to the structured component layout.

### v0.2.3 - 2026-06-26

- Promoted structured component files as primary implementations:
	- app/components/layout/Navbar.tsx
	- app/components/layout/AdminNav.tsx
	- app/components/common/OptimizedImage.tsx
	- app/components/common/LanguageSelector.tsx
- Converted legacy flat component files into compatibility wrappers:
	- app/components/Navbar.tsx
	- app/components/AdminNav.tsx
	- app/components/OptimizedImage.tsx
	- app/components/LanguageSelector.tsx
- Added dynamic loading skeleton usage in map and timeline pages.

### v0.2.4 - 2026-06-26

- Backend runtime alignment for local testing:
	- backend/package.json dev script changed to ts-node -r tsconfig-paths/register src/index.ts
	- backend/package.json module type aligned to commonjs
- Runtime test attempt result:
	- Backend startup now reaches configuration loading successfully
	- Current blocker for live API smoke tests is missing DATABASE_URL environment variable in backend runtime context

### v0.2.5 - 2026-06-26

- Smoke test rerun with EMAIL_FROM set to test@example.com.
- Backend started successfully with Docker Postgres credentials and temporary local env values.
- Verified live endpoints:
	- GET /api/health returned status ok
	- GET /api/events returned 200 with event payload
	- POST /api/auth/login returned 200 with placeholder pending response (expected for current implementation stage)

### v0.2.6 - 2026-06-26

- Per-checklist audit executed against specs/IMPLEMENTATION_PLAN.md.
- Overall status snapshot:
	- Phase 1: Mostly complete with remaining verification closure items.
	- Phase 2: Partial (auth service/flow and middleware split still incomplete).
	- Phase 3: Partial (component restructuring in progress, not fully closed).
	- Phase 4: Partial (headers/rate limiting active, full refresh-token flow not complete).
	- Phase 5: Not complete (automated test stack and coverage targets pending).

### v0.2.7 - 2026-06-26

- Implemented backend authentication service and route flow:
	- Added backend/src/services/AuthService.ts
	- Completed /api/auth/signup, /api/auth/register, /api/auth/login, /api/auth/refresh, /api/auth/logout behavior in backend/src/routes/auth.ts
- Added missing middleware files required by implementation plan:
	- backend/src/middleware/errorHandler.ts
	- backend/src/middleware/validation.ts
	- backend/src/middleware/logging.ts
	- backend/src/middleware/rateLimit.ts
- Wired backend entrypoint to middleware-layer modules instead of direct utility imports for logging/rate-limit/error middleware.
- Closed additional Phase 2 method gaps:
	- PermissionService.canEditEvent and PermissionService.hasRole
	- EventRepository.findByYear and findByCharacterName
	- CharacterRepository.findByEvent
	- CharacterService.getCharacter, createCharacter, updateCharacter
- Smoke validation run:
	- Signup: 201 Created
	- Login: 200 OK
	- Refresh (cookie): 200 OK
	- Logout with valid Bearer + cookie: 200 OK

### v0.2.8 - 2026-06-26

- Completed character API CRUD route coverage in backend/src/routes/characters.ts:
	- POST /api/characters (curator/super_user)
	- PUT /api/characters/:id (curator/super_user)
	- DELETE /api/characters/:id (super_user)
- Fixed route ordering to prevent /search/by-name and /alive-in/:year from being shadowed by /:id.
- Extended CharacterService with deleteCharacter and linked-character event retrieval support.

### v0.2.9 - 2026-06-26

- Implemented Phase 4 auth hardening for refresh-token persistence and rotation:
	- Added backend/src/repositories/RefreshTokenRepository.ts
	- AuthService now persists refresh tokens, validates active tokens from DB, and revokes rotated tokens
	- Added explicit alias endpoint POST /api/auth/refresh-token (in addition to /api/auth/refresh)
	- Added startup guard in backend/src/utils/database.ts to ensure refresh_tokens table/indexes exist
- Added refresh_tokens table/indexes to db/schema.sql and DATABASE_SETUP.sql for schema parity.
- Fixed runtime schema mismatches uncovered during smoke tests:
	- Character create/update no longer write non-existent updated_at field
	- Place repository now maps DB columns (current_name/lat/lng) to API shape (name/latitude/longitude)
- Runtime smoke validation results:
	- POST /api/auth/refresh-token: 200
	- Character protected CRUD: update 200, delete 204
	- Place protected CRUD: create 201, update 200, delete 204
	- POST /api/auth/logout with Bearer + cookie: 200

### v0.2.10 - 2026-06-26

- Closed additional pending implementation-plan items:
	- Removed legacy backup directory _backup/ from workspace root.
	- Set up backend unit-testing stack with Jest + ts-jest.
	- Added backend test config files:
		- backend/jest.config.cjs
		- backend/jest.setup.ts
	- Added initial service unit tests:
		- backend/src/services/PermissionService.test.ts
		- backend/src/services/AuthService.test.ts
	- Added backend script: npm run test:coverage
- Test validation:
	- backend unit tests: 2 suites passed, 7 tests passed
	- backend type-check: clean

### v0.2.11 - 2026-06-26

- Added required ADRs under docs/adr to satisfy implementation plan documentation tasks:
	- docs/adr/0001-jwt-refresh-token-strategy.md
	- docs/adr/0002-modular-backend-architecture.md
	- docs/adr/0003-repository-pattern-vs-orm.md

### v0.2.12 - 2026-06-26

- Added backend integration testing scaffold using supertest.
- Installed backend test dependencies:
	- supertest
	- @types/supertest
- Added integration test script:
	- backend/package.json -> npm run test:integration
- Added integration test suites:
	- backend/src/integration/auth.integration.test.ts
	- backend/src/integration/events.integration.test.ts
- Coverage of new integration tests:
	- Auth flow route behavior (login, refresh-token rotation path, logout)
	- Event route behavior (create event, approve authorization checks)
- Validation results:
	- Integration tests: 2 suites passed, 6 tests passed
	- Full backend tests: 4 suites passed, 13 tests passed
	- Backend type-check: clean

### v0.2.13 - 2026-06-26

- Added frontend testing stack at repository root for Next.js + React components.
- Installed frontend testing dependencies:
	- jest
	- jest-environment-jsdom
	- @testing-library/react
	- @testing-library/jest-dom
	- @testing-library/user-event
	- @testing-library/dom
	- @types/jest
- Added root testing config files:
	- jest.config.cjs
	- jest.setup.ts
- Added root test scripts in package.json:
	- npm test
	- npm run test:frontend
	- npm run test:watch
- Added first frontend permission-based test suite:
	- app/admin/page.test.tsx
	- Validates redirect behavior for unauthenticated users and regular users
	- Validates curator access to admin pending-events view
- Validation results:
	- Frontend tests: 1 suite passed, 3 tests passed
	- Backend tests (regression sanity): 4 suites passed, 13 tests passed

### v0.2.14 - 2026-06-26

- Expanded backend integration coverage for authorization/permission matrix.
- Updated backend integration suite:
	- backend/src/integration/events.integration.test.ts
		- Added super_user approval success path
		- Added non-curator reject denial path
	- Added new admin integration suite:
		- backend/src/integration/admin.integration.test.ts
		- Verifies super_user-only access for:
			- GET /api/admin/users
			- PUT /api/admin/users/:id/role
		- Verifies forbidden responses for non-super_user roles
- Validation results:
	- Backend integration tests: 3 suites passed, 12 tests passed
	- Full backend tests: 5 suites passed, 19 tests passed
	- Backend type-check: clean

### v0.2.15 - 2026-06-26

- Added automated accessibility test tooling and checks for frontend components/pages.
- Installed frontend accessibility test dependencies:
	- jest-axe
	- axe-core
- Enabled jest-axe matcher in test setup:
	- jest.setup.ts
- Added automated accessibility test suite:
	- app/accessibility.test.tsx
	- Coverage includes:
		- Navbar logged-out render state
		- Admin page curator render state
	- Assertions use axe violation checks (`toHaveNoViolations`).
- Validation results:
	- Frontend tests: 2 suites passed, 5 tests passed

### v0.2.16 - 2026-06-26

- Fixed frontend runtime "Not Found" crashes caused by frontend/backend API route mismatch.
- Added backend compatibility routes/endpoints used by frontend:
	- `GET/POST/PUT/DELETE /api/frames`
	- `GET/POST/PUT/DELETE /api/place-types`
	- `GET /api/admin/events/pending` (curator/super_user)
	- `GET /api/events/my` (authenticated user events)
	- Added `PATCH /api/events/:id/approve` and `PATCH /api/events/:id/reject` aliases
- Improved query-param compatibility in places nearby endpoint:
	- Accepts `lng` alias for longitude
	- Accepts `radius` alias for distance
- Improved frontend API error message extraction in `lib/api.ts` to surface backend `message` consistently.
- Live endpoint validation after backend restart:
	- `/api/frames` -> 200
	- `/api/place-types` -> 200
	- `/api/events/my` -> 401 without auth (expected)
	- `/api/admin/events/pending` -> 401 without auth (expected)
- Test validation:
	- Backend integration tests: 3 suites passed, 12 tests passed
	- Frontend tests: 2 suites passed, 5 tests passed

### v0.2.17 - 2026-06-26

- Added backend compatibility route group for user preferences:
	- `GET /api/user/preferences`
	- `POST /api/user/preferences`
- Mounted new user route namespace in backend app bootstrap:
	- `app.use('/api/user', userRoutes)`
- Added startup database compatibility initialization for `user_preferences` table with user/frame references.
- Validated endpoint behavior after restart:
	- `/api/user/preferences` -> 401 without auth (expected)
	- `/api/events/my` -> 401 without auth (expected)
	- `/api/frames` -> 200
- Regression validation:
	- Backend integration tests: 3 suites passed, 12 tests passed
	- Frontend tests: 2 suites passed, 5 tests passed

### v0.2.18 - 2026-06-26

- Added backend integration test coverage for compatibility endpoints introduced during frontend/backend contract alignment.
- Updated events integration suite:
	- Added `GET /api/events/my` coverage
	- Added repository mock to avoid accidental real-DB calls in route tests
- Added new user preferences integration suite:
	- `GET /api/user/preferences` no-record flow (`hasPreferences: false`)
	- `GET /api/user/preferences` existing-record flow
	- `POST /api/user/preferences` upsert flow
	- `POST /api/user/preferences` validation error flow
- Validation results:
	- Backend integration tests: 4 suites passed, 17 tests passed
	- Backend type-check: clean

### v0.2.19 - 2026-06-26

- Restored `app/components/EventForm.tsx` from placeholder/stub state to a working event creation modal component used by map interaction flow.
- Added frontend unit/integration-style tests for missing Phase 5 coverage targets:
	- `app/components/EventForm.test.tsx`
		- Verifies event submission payload and success callback execution
	- `app/components/Map.test.tsx`
		- Verifies map context-menu interaction opens EventForm for authenticated users
- Test infrastructure for map interaction uses deterministic mocks for `react-leaflet` and `leaflet` to keep jsdom execution stable.
- Validation results:
	- Frontend tests: 4 suites passed, 7 tests passed

### v0.2.20 - 2026-06-26

- Hardened backend input validation for high-risk write endpoints (Phase 4 validation hardening):
	- Events routes now normalize and validate create/update payloads (supports `event_date`/`start_date` and `lat`/`lng` aliases)
	- Characters routes now validate create/update payload field types and required name
	- Places routes now validate create/update payload required fields and coordinate ranges
	- Added reject-reason type validation on event reject endpoints
- Added backend integration test coverage for validation error paths and happy paths:
	- New `backend/src/integration/characters.integration.test.ts`
	- New `backend/src/integration/places.integration.test.ts`
	- Expanded `backend/src/integration/events.integration.test.ts` with malformed payload case
- Validation results:
	- Backend integration tests: 6 suites passed, 22 tests passed
	- Backend type-check: clean
	- Frontend tests (regression): 4 suites passed, 7 tests passed

### v0.2.21 - 2026-06-26

- Added backend integration coverage for additional security and validation edge cases:
	- New `backend/src/integration/security.integration.test.ts`
		- Verifies non-Bearer Authorization header format returns 400
		- Verifies valid Bearer-format header proceeds successfully
	- Expanded `backend/src/integration/auth.integration.test.ts`
		- Verifies `POST /api/auth/refresh-token` returns 400 when refresh token is missing
	- Expanded `backend/src/integration/events.integration.test.ts`
		- Verifies invalid pagination query (`limit=0`) returns 400
	- Expanded `backend/src/integration/places.integration.test.ts`
		- Verifies invalid `nearby` query params return 400
		- Verifies invalid `bounds` query params return 400
- Validation results:
	- Backend integration tests: 7 suites passed, 28 tests passed
	- Backend type-check: clean
	- Frontend tests (regression): 4 suites passed, 7 tests passed

### v0.2.22 - 2026-07-03

- Added a dedicated runbook at [docs/RUNBOOK.md](docs/RUNBOOK.md) and linked it from the README startup checklist.
- Fixed the admin events management view so it loads both approved and pending events for the full moderation/editing list.
- Fixed map pin interaction so clicking a pin reliably opens its popup via Leaflet marker refs.
- Validation results:
	- Frontend build: successful
	- Frontend tests: 4 suites passed, 7 tests passed

### v0.2.23 - 2026-07-03

- Aligned local backend development defaults with the actual docker-compose PostgreSQL credentials.
- Updated the environment template so fresh local setup points to the correct `geohistory_user`/`change_this_password_12345` database credentials.
- Updated the README schema initialization command to use the compose service name and correct database user.
- Validation result:
	- `npm run dev` in `backend/` now reaches normal startup and reports a successful database connection.

Note: This section will be appended for each new implementation batch so changes are tracked by version directly in this README.

## License

MIT