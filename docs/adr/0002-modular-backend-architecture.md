# ADR 0002: Modular Backend Architecture vs Monolith

## Status
ACCEPTED

## Context
The legacy backend concentrated routing, business logic, and data access in a monolithic server file, increasing change risk and slowing feature work.

## Decision
Adopt a layered modular backend with routes, services, repositories, middleware, and shared types.

## Rationale
- Improves maintainability and separation of concerns.
- Enables targeted testing at service and repository layers.
- Reduces coupling when adding or modifying endpoints.
- Aligns implementation with project constitution and feature specifications.

## Consequences
- More files and interfaces to maintain.
- Requires strict conventions for cross-layer responsibilities.
- Initial migration effort is higher than incremental monolith edits.
