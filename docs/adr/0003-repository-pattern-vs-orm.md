# ADR 0003: Repository Pattern vs ORM

## Status
ACCEPTED

## Context
GeoHistory uses PostgreSQL and currently needs explicit SQL control during schema evolution and refactoring.

## Decision
Use a repository pattern with parameterized SQL queries instead of introducing a full ORM.

## Rationale
- Keeps SQL explicit and predictable during refactor phases.
- Avoids ORM abstraction overhead and migration lock-in.
- Supports incremental optimization for performance-sensitive queries.
- Enforces centralized data-access boundaries.

## Consequences
- More manual query writing and mapping logic.
- Developers must maintain SQL safety and consistency standards.
- Advanced ORM features (change tracking, relation mapping) are not available by default.
