# GeoHistory Runbook

Use this runbook only when a task needs local infrastructure or executable validation. For documentation-only work, static review, or a localized code change with a focused test, do not start the full stack.

## Choose Validation Scope

- **Documentation or static review:** read the relevant files and use a focused search or Markdown check; do not start Docker or the app.
- **Localized frontend or backend change:** run the closest targeted test or type-check first.
- **Cross-layer API, database, or browser workflow change:** start only the required services, then run the focused integration or end-to-end check.
- Inspect the relevant `package.json` before running a command. Reuse an already-running service rather than starting a duplicate.
- Do not reset databases, install packages, update lockfiles, regenerate artifacts, or modify environment files unless the task explicitly requires it.

## Start Infrastructure When Needed

1. Confirm Docker is available.

```bash
docker-compose ps
```

2. Start the database and supporting services.

```bash
docker-compose up -d
```

3. Start the app stack only for application or API validation.

```bash
npm run dev
```

4. Check the backend health endpoint only when the backend was started.

```bash
curl http://localhost:3001/api/health
```

5. Open the frontend only for manual or end-to-end validation.

- http://localhost:3000

## Focused Test Loop

Run the smallest applicable command after a change. Use all three only for cross-layer work or when explicitly requested:

```bash
npm run test:frontend
cd backend && npm run test:integration
cd backend && npm run type-check
```

## Shutdown

```bash
docker-compose down
```

Stop only services you started for the task. Do not shut down shared or pre-existing development services.

## Common Failure Checks

- If the frontend shows stale data, restart `npm run dev` after backend route changes.
- If a page is blank, run the frontend build and inspect TypeScript or ESLint errors.
- If the backend is unreachable, confirm port 3001 is free and `docker-compose ps` shows the database up.