# GeoHistory Constitution: Architecture & Foundational Principles

*Last Updated: 2026-06-25*

---

## 1. Project Vision & Goals

### 1.1 Mission
GeoHistory is a collaborative, role-based historical event mapping platform that enables users to create, review, and explore historical events on an interactive global timeline and map interface.

### 1.2 Core Principles

**Maintainability First**
- Code is read more often than written. Every decision prioritizes clarity and long-term health over short-term convenience.
- Modular design enables feature development without understanding the entire codebase.
- Consistent patterns reduce cognitive load for new contributors.

**Scalability-Conscious**
- Architecture supports growing user base, event volume, and concurrent interactions.
- Data access patterns are optimized for read-heavy workflows (map queries, timeline filtering).
- Database queries are indexed and avoid N+1 problems.

**Security-Aware**
- Every API endpoint validates input and enforces access control.
- Authentication and authorization are decoupled; permission changes propagate consistently.
- Sensitive data is encrypted, never logged, and validated before use.

**Developer Experience**
- Local development environment mirrors production (Docker + PostgreSQL).
- Setup takes < 30 minutes for a new developer.
- Error messages guide developers toward fixes.
- Consistent tooling (linting, formatting, type-checking) catches issues before review.

**Pragmatic Technology Choice**
- All technology is free, open-source, and widely supported.
- No external SaaS dependencies for core functionality.
- Minimal third-party libraries; prefer standard library and well-maintained packages.

---

## 2. Layered Architecture Overview

### 2.1 Application Layers

The refactored GeoHistory uses a **four-layer architecture**:

```
┌─────────────────────────────────────────┐
│  Presentation Layer                     │
│  (Next.js, React Components, UI Logic)  │
├─────────────────────────────────────────┤
│  API Layer                              │
│  (Express Routes, Request/Response)     │
├─────────────────────────────────────────┤
│  Business Logic Layer                   │
│  (Services, Validation, Permission)     │
├─────────────────────────────────────────┤
│  Data Access Layer                      │
│  (Repositories, Database Queries)       │
├─────────────────────────────────────────┤
│  Database Layer                         │
│  (PostgreSQL)                           │
└─────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Examples |
|-------|-----------------|----------|
| **Presentation** | Render UI, handle user interactions, manage local state, call APIs | Map rendering, form submission, modal dialogs |
| **API** | Route definition, middleware (auth, CORS), request/response marshalling | `GET /api/events`, `POST /api/characters` |
| **Business Logic** | Feature implementation, validation, permission checks, cross-entity orchestration | "Approve event" workflow, "Create character with linked events" |
| **Data Access** | SQL query construction, parameterization, caching, query optimization | `findEventById()`, `updateEventApprovalStatus()` |
| **Database** | Schema, indexes, constraints, relationships | `events` table, `users` table, foreign keys |

### 2.3 Layer Communication Rules

- **Downward only**: Presentation → API → Business Logic → Data Access → Database
- **Error propagation upward**: Each layer catches and transforms errors appropriately
- **No layer skipping**: Business logic never directly accesses database; use repositories
- **Presentation never makes SQL**: All data fetched through API layer

---

## 3. Technology Stack Rationale

### 3.1 Selected Technologies

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend Framework** | Next.js | 14.x | Server-side rendering, TypeScript support, built-in image optimization, API routes for initial context |
| **UI Framework** | React | 18.x | Component-based, widely known, rich ecosystem |
| **Styling** | Tailwind CSS | Latest | Utility-first, minimal CSS output, consistent theming, no CSS-in-JS complexity |
| **Type System** | TypeScript | 5.x | Catches type errors at compile time, improves IDE support, self-documenting code |
| **Backend Framework** | Express.js | 4.x | Lightweight, minimal overhead, mature middleware ecosystem, easy modularization |
| **Runtime** | Node.js | 18+ LTS | Fast, non-blocking I/O, single language for frontend and backend |
| **Database** | PostgreSQL | 14+ | Powerful query language, JSONB support, strong consistency, excellent Docker support |
| **Authentication** | JWT (jsonwebtoken) | Latest | Stateless, scalable, no session storage required |
| **Password Hashing** | bcryptjs | Latest | Secure, works in Node.js, configurable work factor |
| **HTTP Client** | Axios | Latest | Promise-based, interceptor support, request cancellation |
| **Mapping** | Leaflet + react-leaflet | Latest | Lightweight, plugin-rich, no API key required |
| **Container Runtime** | Docker + docker-compose | Latest | Consistent dev/prod environments, easy multi-service orchestration |
| **Package Manager** | npm | Latest | Built-in with Node.js, no external dependency |

### 3.2 Tech Constraints

- **No-cost**: All technology is free and open-source.
- **Local-first**: Development environment runs entirely in WSL + Docker; production mirrors local setup.
- **Minimal external services**: No Supabase, no Firebase, no third-party auth. PostgreSQL is the source of truth.
- **Single codebase**: One repository contains frontend, backend, and database schema.

### 3.3 Justified Alternatives & Exclusions

**Why not Rails/Django?** Overkill for this project; full-stack JS reduces context switching.

**Why not GraphQL?** REST + well-designed endpoints sufficient; GraphQL adds complexity without clear benefit for current query patterns.

**Why not Kubernetes?** Local Docker Compose meets dev requirements; premature for this scale.

**Why not Prisma ORM?** Raw SQL with parameterized queries is more transparent; Prisma adds type safety but hides query complexity.

**Why PostgreSQL, not MongoDB?** Strong schema enforcement, ACID transactions, and relational queries needed for event approval workflows and permission checks.

---

## 4. Directory Structure & Naming Conventions

### 4.1 Root-Level Organization

```
GeoHistory/
├── app/                          # Next.js app directory (frontend)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── auth/                    # Auth pages
│   ├── map/                     # Map interface page
│   ├── timeline/                # Timeline interface page
│   ├── admin/                   # Admin panel (protected routes)
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── events/             # Event management
│   │   ├── characters/         # Character management
│   │   ├── places/             # Place management
│   │   ├── place-types/        # Place type management
│   │   └── frames/             # Historical frame management
│   ├── components/              # Reusable React components
│   │   ├── common/             # Buttons, modals, spinners (atomic)
│   │   ├── features/           # Feature-specific (Map, EventForm, Timeline)
│   │   ├── layout/             # Layout components (Navbar, Sidebar)
│   │   └── admin/              # Admin-specific components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   │   ├── api.ts              # API client (all fetch calls)
│   │   ├── database.ts         # Database utilities (deprecated, remove)
│   │   ├── imageUtils.ts       # Image handling
│   │   ├── i18n.ts             # Internationalization
│   │   └── utils/              # Generic utilities (validation, formatting)
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # Central type exports
│   ├── constants/               # App-wide constants
│   ├── styles/                  # Global styles (CSS)
│   └── globals.css              # Tailwind imports
├── backend/                     # Express.js backend
│   ├── src/                     # Backend source code
│   │   ├── index.ts            # Entry point, middleware setup
│   │   ├── routes/             # Route handlers (modular)
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── events.ts      # Event CRUD endpoints
│   │   │   ├── characters.ts  # Character CRUD endpoints
│   │   │   ├── places.ts      # Place CRUD endpoints
│   │   │   ├── admin.ts       # Admin-only endpoints
│   │   │   └── health.ts      # Health check endpoint
│   │   ├── services/           # Business logic
│   │   │   ├── AuthService.ts # Auth logic, JWT handling
│   │   │   ├── EventService.ts # Event creation, approval workflows
│   │   │   ├── CharacterService.ts # Character management
│   │   │   ├── PlaceService.ts # Place management
│   │   │   └── PermissionService.ts # Permission checks
│   │   ├── repositories/       # Data access layer
│   │   │   ├── UserRepository.ts # User queries
│   │   │   ├── EventRepository.ts # Event queries
│   │   │   ├── CharacterRepository.ts # Character queries
│   │   │   ├── PlaceRepository.ts # Place queries
│   │   │   └── BaseRepository.ts # Common query patterns
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts         # JWT verification
│   │   │   ├── errorHandler.ts # Global error handler
│   │   │   ├── cors.ts         # CORS configuration
│   │   │   └── logging.ts      # Request/response logging
│   │   ├── types/              # Backend TypeScript types
│   │   │   └── index.ts        # Centralized types
│   │   ├── config/             # Configuration
│   │   │   ├── database.ts     # Database connection
│   │   │   ├── env.ts          # Environment variables
│   │   │   └── constants.ts    # Backend constants
│   │   └── utils/              # Backend utilities
│   │       ├── validators.ts   # Input validation
│   │       ├── errors.ts       # Custom error classes
│   │       └── formatting.ts   # Data formatting
│   ├── package.json            # Backend dependencies
│   └── server.js               # Legacy file (TO BE REMOVED)
├── db/                         # Database schema & scripts
│   ├── schema.sql              # Full schema definition
│   ├── migrations/             # Migration scripts (future)
│   └── seeds/                  # Seed data for development
├── public/                     # Static assets
│   └── manifest.json           # PWA manifest
├── docs/                       # General documentation
│   └── DESIGN_SPECS.md         # Product design (legacy)
├── specs/                      # **NEW** Refactoring specifications
│   ├── Constitution.md         # This file
│   ├── Security.md             # Security spec
│   ├── Features.md             # Functional requirements
│   ├── Design.md               # UI/UX & component architecture
│   └── Operations.md           # Deployment & DX
├── .github/                    # GitHub configuration
│   └── copilot-instructions.md # Project guidelines
├── docker-compose.yml          # Local dev orchestration
├── Dockerfile.frontend         # Frontend image
├── Dockerfile.backend          # Backend image
├── package.json                # Root dependencies (concurrently for dev)
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Setup & overview
└── .env.example                # Environment variable template
```

### 4.2 Naming Conventions

#### TypeScript Files
- **Components**: PascalCase, `.tsx` extension (e.g., `EventForm.tsx`, `MapContainer.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUserPreferences.ts`, `useEventFilters.ts`)
- **Utilities**: camelCase (e.g., `imageUtils.ts`, `validators.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Event.ts`, `User.ts`)
- **Services**: PascalCase with `Service` suffix (e.g., `EventService.ts`, `AuthService.ts`)
- **Repositories**: PascalCase with `Repository` suffix (e.g., `EventRepository.ts`)
- **Middleware**: camelCase (e.g., `auth.ts`, `errorHandler.ts`)

#### Variables & Functions
- **Functions**: camelCase (e.g., `fetchEvents()`, `validateEmail()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_TIMEOUT`)
- **React Components**: PascalCase (e.g., `<EventCard />`, `<MapContainer />`)
- **Events**: `on` prefix + camelCase (e.g., `onClick`, `onEventApproved`)
- **Booleans**: `is`/`has`/`can` prefix (e.g., `isLoading`, `hasPermission`, `canEdit`)

#### Classes & Types
- **Database entities**: PascalCase, singular (e.g., `Event`, `User`, `Character`)
- **API request types**: `{Entity}Request` or `Create{Entity}Dto` (e.g., `EventRequest`, `CreateEventDto`)
- **API response types**: `{Entity}Response` or `{Entity}Dto` (e.g., `EventResponse`, `EventDto`)
- **Database models**: `{Entity}Model` (e.g., `EventModel`)

#### Directories
- **Feature directories**: plural, lowercase (e.g., `components/`, `hooks/`, `utils/`, `services/`)
- **Domain subdirectories**: singular, lowercase (e.g., `admin/events/`, not `admins/eventss/`)
- **Internal organization by concern**: `common/`, `features/`, `layout/` within `components/`

### 4.3 File Organization Principles

**Single Responsibility**: Each file does one thing well.
- `EventForm.tsx` = form UI only
- `EventService.ts` = event business logic
- `EventRepository.ts` = event database queries

**Co-location**: Related files live near each other.
- `components/features/EventForm.tsx` + `hooks/useEventForm.ts` in same area
- `types/Event.ts` and `services/EventService.ts` in separate domains; imported as needed

**Public/Private**: Barrel exports hide internal structure.
- `components/index.ts` exports `export { EventForm }` (public API)
- Consumers import `from "components"` not `from "components/features/EventForm"`

---

## 5. Code Organization Principles

### 5.1 Module Boundaries

**Clear Inputs/Outputs**
- Each module has a well-defined interface (imports and exports)
- Dependencies flow downward (Presentation → API → Services → Repositories → Database)
- No circular imports

**High Cohesion, Low Coupling**
- Related functionality grouped together (e.g., all event operations in `EventService`)
- Modules don't know about unnecessary implementation details of other modules

**Dependency Injection**
- Services receive repositories (or other dependencies) as constructor parameters
- Makes testing easier and dependency relationships explicit

**Error Handling**
- Each layer catches errors appropriately:
  - **Repositories**: SQL errors → custom error class
  - **Services**: Business logic errors → domain error class
  - **API**: All errors → standardized HTTP response
  - **Frontend**: API errors → user-facing message

### 5.2 Import Rules

**Frontend (app/)**
```typescript
// ✓ Allowed
import Button from '@/components/common/Button'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { formatDate } from '@/lib/utils/formatting'
import { Event } from '@/types'
import axios from 'axios'

// ✗ Forbidden
import EventForm from '../../../components/features/EventForm'  // Use barrel exports
import sql from 'sql'  // No direct database access from frontend
```

**Backend (backend/src/)**
```typescript
// ✓ Allowed
import { EventService } from '@/services/EventService'
import { EventRepository } from '@/repositories/EventRepository'
import { AppError, ValidationError } from '@/utils/errors'
import { validateEventInput } from '@/utils/validators'

// ✗ Forbidden
import pg from 'pg'  // Use repositories to access database
import bcryptjs from 'bcryptjs'  // Restrict crypto to AuthService
```

**Shared Types**
```typescript
// ✓ Allowed - frontend and backend import the same type definitions
import { Event, User, EventStatus } from '@shared/types'

// If types are truly shared, define them in both:
// - backend/src/types/Event.ts
// - app/types/Event.ts
// (OR: create backend/shared/types that frontend imports)
```

### 5.3 Feature Development Workflow

When adding a new feature, follow this order:

1. **Define type** (`types/NewFeature.ts`)
2. **Create repository** (`repositories/NewFeatureRepository.ts`) — database queries
3. **Create service** (`services/NewFeatureService.ts`) — business logic
4. **Create route** (`routes/newFeature.ts`) — API endpoint
5. **Create component** (`components/features/NewFeature.tsx`) — UI
6. **Create hook** (if needed) (`hooks/useNewFeature.ts`) — UI logic
7. **Wire into page** (`app/newFeature/page.tsx`)

This ensures dependencies always flow correctly.

---

## 6. Decision Records

### 6.1 Modular Backend (vs. Monolithic server.js)

**Decision**: Refactor `backend/server.js` into modular route handlers and services.

**Rationale**:
- Current server.js is 600+ lines; difficult to navigate and reason about
- Mixed concerns (routes, database queries, business logic) in one file
- Hard to test individual endpoints
- New routes require finding the right place to add code

**Implementation**:
- One route file per domain (`auth.ts`, `events.ts`, `characters.ts`, etc.)
- Separate service layer for business logic
- Separate repository layer for database queries
- Express middleware handles cross-cutting concerns (auth, error handling, logging)

**Trade-offs**:
- More files to maintain (but smaller, focused files are easier to understand)
- Slight startup overhead (but negligible for local development)

### 6.2 PostgreSQL + Raw SQL (vs. ORM)

**Decision**: Use parameterized SQL queries with a custom repository layer instead of an ORM like Prisma.

**Rationale**:
- Transparency: Developers see exactly what SQL is executed
- Performance: No ORM abstraction overhead
- Simplicity: No schema migration tool complexity
- Cost: No additional dependencies

**Implementation**:
- `BaseRepository` class with common patterns (findById, findAll, insert, update, delete)
- Specialized repositories inherit and add domain-specific queries
- All queries parameterized (prevents SQL injection)

**Trade-offs**:
- Manual schema management (using `db/schema.sql`)
- Slightly more verbose than ORM (but more explicit)

### 6.3 JWT Authentication (vs. Sessions)

**Decision**: Use JWT tokens with refresh token rotation for stateless authentication.

**Rationale**:
- Stateless: No session storage required
- Scalable: Works across multiple server instances
- Standard: Well-supported, widely understood

**Implementation**:
- Access token (short-lived, 15 mins)
- Refresh token (long-lived, 7 days, rotated on use)
- Stored in httpOnly cookies (not localStorage)

**Trade-offs**:
- Token revocation requires token blacklist (implemented in PermissionService)
- Slightly more complex refresh logic

### 6.4 Layered Architecture (vs. Screaming Architecture)

**Decision**: Organize code by technical layer (routes, services, repositories) instead of by feature.

**Rationale**:
- Clear separation of concerns
- Easy to understand where code lives (all business logic in services)
- Facilitates code reuse across features

**Alternative (not chosen): Feature-based**
```
# Feature structure (screaming architecture)
features/
  events/
    EventComponent.tsx
    EventService.ts
    EventRepository.ts
  characters/
    CharacterComponent.tsx
    CharacterService.ts
```

**Why not**: Harder to find common patterns; easier to duplicate code; less clear where to add shared utilities.

---

## 7. Dependencies & Constraints

### 7.1 Hard Constraints

**Technology Stack**
- All technology must be free and open-source
- No paid SaaS services (no Supabase, Firebase, Auth0, etc.)
- All data stored in PostgreSQL running in Docker

**Development Environment**
- Local development uses WSL 2 + Docker
- Production deployment mirrors local setup
- Single docker-compose.yml orchestrates all services

**Team & Deployment**
- Minimum 3 services: PostgreSQL, Express backend, Next.js frontend
- Must run on developer laptops; no external cloud required
- Git repository is single codebase (no monorepo)

### 7.2 Soft Constraints

**Performance**
- Page load times < 2 seconds
- API responses < 500ms for typical queries
- Support 1000+ concurrent users initially

**User Experience**
- Support English and Spanish languages
- Responsive on mobile, tablet, desktop
- Accessible (WCAG 2.1 AA)

**Maintenance**
- Code reviewed before merge
- Type-safe (no `any` in new code)
- Consistent linting and formatting

### 7.3 Known Limitations

**Current Codebase**
- Backend is monolithic; requires refactoring
- Some Supabase references remain; need cleanup
- Duplicate component files (Map.tsx, Map.tsx.bkp); need consolidation
- No test coverage; should be added post-refactor

**Database**
- No migration tool in place; migrations are manual (db/schema.sql)
- Schema versioning not implemented
- No backup automation (out of scope for local dev)

### 7.4 Future Considerations

**Post-Refactor Phases**:
1. Add comprehensive test suite (Jest for backend, React Testing Library for frontend)
2. Implement database migration tool (Flyway or custom)
3. Add monitoring and alerting (open-source options like Prometheus)
4. Containerize and deploy to small cloud instance (optional)

---

## 8. Cross-Layer Communication Example

To illustrate how layers interact, here's the flow for "**Create and Approve Event**" feature:

### Frontend
```
User fills form → EventForm.tsx 
  ↓
onSubmit → calls `createEvent()` from `lib/api.ts`
  ↓
POST /api/events with event data
```

### API Layer (backend)
```
Express route handler:
  POST /api/events
    ↓
  Auth middleware verifies JWT
    ↓
  Route handler calls EventService.createEvent()
```

### Business Logic Layer
```
EventService.createEvent():
  ↓
  Validates input (EventRepository.validateEvent)
  ↓
  Checks user permission (PermissionService.canCreateEvent)
  ↓
  Calls EventRepository.insert()
  ↓
  Returns Event object to API layer
```

### Data Access Layer
```
EventRepository.insert():
  ↓
  Parameterizes SQL query
  ↓
  Executes on PostgreSQL connection pool
  ↓
  Returns inserted event with ID
```

### Response Back to Frontend
```
API returns 200 { event: {...} }
  ↓
Frontend updates state with new event
  ↓
UI re-renders, shows success message
```

---

## 9. References to Other Specs

- **Security.md** — Defines authentication, authorization, and how permissions integrate into this architecture
- **Features.md** — Documents all API endpoints and which services/repositories they use
- **Design.md** — Defines React component structure and how presentation layer is organized
- **Operations.md** — Covers Docker setup, error handling patterns, and local dev workflow

---

## Appendix: Glossary

| Term | Definition |
|------|-----------|
| **Service** | Business logic layer; orchestrates repositories and enforces rules |
| **Repository** | Data access layer; encapsulates SQL queries |
| **Middleware** | Express function that processes requests before routes |
| **Route** | Express endpoint handler; maps HTTP method + path to function |
| **Layer** | Horizontal slice of architecture (e.g., "API Layer") |
| **Domain** | Vertical slice of functionality (e.g., "events", "characters") |
| **DTO** | Data Transfer Object; structure for API requests/responses |
| **Entity** | Domain model; represents a real-world concept (User, Event, Character) |
| **Barrel Export** | `index.ts` file that re-exports from subdirectories |

