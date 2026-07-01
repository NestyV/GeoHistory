# ADR 0001: JWT Refresh Token Strategy

## Status
ACCEPTED

## Context
GeoHistory requires stateless authentication for API clients while supporting token revocation and session continuity.

## Decision
Use short-lived JWT access tokens with rotating refresh tokens.

## Rationale
- Access tokens remain short-lived to reduce blast radius.
- Refresh token rotation limits replay risk.
- Stateless access-token verification keeps horizontal scaling simple.
- Revocation is supported via refresh token persistence and revocation tracking.

## Consequences
- Requires refresh-token persistence and revocation checks.
- Adds implementation complexity to auth endpoints.
- Clients must handle refresh and retry flows.
