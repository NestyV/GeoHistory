# GeoHistory Project Guidelines

> **Project Status**: Undergoing comprehensive refactoring (Phase 1-5). See [specs/](../specs/) for architecture, security, features, design, and operations specifications.

## Architecture Overview

**Tech Stack**:
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet
- **Backend**: Express.js, Node.js 18+, PostgreSQL (Docker)
- **Auth**: JWT with refresh token rotation (stateless, no sessions)
- **Deployment**: Docker Compose (local dev & production-ready)

**Key Points**:
- All data stored in PostgreSQL (running in Docker locally)
- Backend uses modular route handlers, services, and repositories
- Frontend uses component-based architecture with error boundaries
- Role-based access control (user, curator, super_user)
- No external SaaS dependencies (auth, database, etc.)

---

## Getting Started (Local Development)

### Prerequisites
- WSL 2 + Ubuntu 20.04 LTS (Windows users)
- Docker Desktop with WSL 2 integration
- Node.js 18 LTS
- Git

### Quick Start

```bash
# 1. Clone and enter directory
git clone <repo-url>
cd GeoHistory

# 2. Create environment file
cp .env.example .env

# 3. Start Docker containers
docker-compose up -d

# 4. Wait for database to be ready (10-15 seconds)
sleep 15

# 5. Initialize database schema
docker-compose exec db psql -U postgres -d geohistory < db/schema.sql

# 6. Install dependencies
npm install

# 7. Start dev server
npm run dev
```

**Verify**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health
- Database: PostgreSQL on localhost:5432

See [specs/Operations.md § 1](../specs/Operations.md#1-development-environment-setup) for detailed setup.

---

## Project Structure

**Key Directories**:
- `specs/` — Architecture specifications (Constitution, Security, Features, Design, Operations)
- `app/` — Next.js frontend (pages, components, hooks)
- `backend/src/` — Express backend (routes, services, repositories)
- `db/` — Database schema and migrations
- `_backup/` — Archived legacy files (cleanup after refactoring verified)

See [specs/Constitution.md § 4.1](../specs/Constitution.md#41-root-level-organization) for full structure.

---

## Development Patterns

### Backend: Adding a New API Endpoint

1. **Define types** in `backend/src/types/`
2. **Create repository** in `backend/src/repositories/` (database queries)
3. **Create service** in `backend/src/services/` (business logic)
4. **Create route** in `backend/src/routes/` (API handler)
5. **Reference** in `backend/src/index.ts`

Example: `POST /api/events/approve`
- Repository: `EventRepository.updateStatus(eventId, 'approved')`
- Service: `EventService.approveEvent(eventId, curatorId)` (validates permission)
- Route: `router.post('/:id/approve', authMiddleware, approveEventHandler)`

See [specs/Constitution.md § 5.3](../specs/Constitution.md#53-feature-development-workflow).

### Frontend: Adding a Component

1. **Determine type**: Atomic (common/), Feature (features/), or Layout (layout/)
2. **Create file** with PascalCase name (e.g., `EventCard.tsx`)
3. **Export interface** for props (TypeScript)
4. **Export from barrel** in `app/components/index.ts`
5. **Use in pages** via `import { EventCard } from '@/components'`

See [specs/Design.md § 2.1](../specs/Design.md#21-component-organization).

---

## Authentication & Permissions

**Authentication**:
- JWT access token (15 min expiry, stored in memory)
- JWT refresh token (7 days, httpOnly cookie, rotated on use)
- Endpoint: `POST /api/auth/login` with email/password

**Authorization**:
- Roles: `user` (default), `curator` (approves events), `super_user` (admin)
- Enforced via `PermissionService` in every protected endpoint
- Permission matrix: See [specs/Security.md § 1.2](../specs/Security.md#12-authorization-permission-checking)

---

## Database

**Location**: `db/schema.sql` (single source of truth)

**To reset database**:
```bash
docker-compose exec db psql -U postgres -c "DROP DATABASE geohistory; CREATE DATABASE geohistory;"
docker-compose exec db psql -U postgres -d geohistory < db/schema.sql
```

**To seed test data** (future):
```bash
docker-compose exec db psql -U postgres -d geohistory < db/seeds/dev.sql
```

**To connect directly**:
```bash
docker-compose exec db psql -U postgres -d geohistory
```

---

## Testing

**Unit tests** (backend services):
```bash
cd backend && npm test
```

**Integration tests** (API endpoints):
```bash
npm run test:integration
```

**E2E tests** (full workflow):
```bash
npm run test:e2e
```

Target: **80%+ code coverage** after refactoring Phase 5.

---

## Debugging

**Backend**:
```bash
node --inspect backend/src/index.ts
# Then attach debugger from VSCode
```

**Frontend**:
- Open Chrome DevTools (F12)
- Use React DevTools extension

**Database**:
```bash
docker-compose logs -f db
```

---

## Security Checklist

Before committing:
- [ ] No console.log of sensitive data (passwords, tokens)
- [ ] All database queries parameterized (no string concatenation)
- [ ] All inputs validated per [specs/Security.md § 3.1](../specs/Security.md#31-input-validation-backend)
- [ ] No hardcoded secrets (use `.env` for all secrets)
- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)

---

## Common Tasks

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run tests | `npm test` |
| Lint code | `npm run lint` |
| Format code | `npm run format` |
| View backend logs | `docker-compose logs -f backend` |
| Reset database | `npm run db:reset` |
| SSH into DB | `docker-compose exec db bash` |

---

## Documentation

**Specs** (start here):
1. [specs/Constitution.md](../specs/Constitution.md) — Architecture & tech stack
2. [specs/Security.md](../specs/Security.md) — Auth, permissions, data protection
3. [specs/Features.md](../specs/Features.md) — API endpoints & workflows
4. [specs/Design.md](../specs/Design.md) — Component patterns & UI standards
5. [specs/Operations.md](../specs/Operations.md) — Deployment, logging, DX

**Implementation**:
- [specs/IMPLEMENTATION_PLAN.md](../specs/IMPLEMENTATION_PLAN.md) — 5-phase refactoring roadmap

## Evidence and Execution Boundaries

### Source Precedence
- For current runtime behavior, inspect the owning code in `app/` or `backend/src/`, its closest test, and the relevant package script.
- For current database state, `db/schema.sql` is authoritative.
- `specs/` defines approved target architecture and requirements; confirm an implementation before treating a planned item as live.
- `docs/DESIGN_SPECS.md` is deprecated and must not drive implementation decisions.
- When these sources conflict, do not guess or reconcile them during unrelated work. Report the conflict and request the intended contract.

### Bounded Execution
- Before editing, read the owning file and one nearby test, type, or call site. Do not conduct broad repository exploration unless local evidence is insufficient.
- Start Docker, development servers, browser automation, or external requests only when the requested validation requires them. Reuse an already-running service rather than starting another.
- Run the smallest relevant validation after a change. Expand to integration or full-suite checks only for cross-layer behavior, a focused failure, or an explicit request.
- Do not install dependencies, update lockfiles, regenerate artifacts, modify environment files, reset databases, or run destructive commands unless the user explicitly requests it.
- Inspect `package.json` before suggesting or running a script, and state why a command is necessary before executing it.

## Execution Guidelines
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in vscode again.
- If the project setup information has additional rules, follow them strictly.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.