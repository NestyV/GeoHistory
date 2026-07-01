# GeoHistory Security Specification

*Last Updated: 2026-06-25*

**Related Specs**: [Constitution.md](Constitution.md) defines the authentication layer; [Features.md](Features.md) documents API endpoints that enforce these policies; [Operations.md](Operations.md) covers logging and monitoring.

---

## 1. Authentication & Authorization Model

### 1.1 Authentication (Verification of Identity)

All API requests (except public endpoints) require a **JWT Bearer token** in the `Authorization` header:

```http
GET /api/events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Structure

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "curator",
  "iat": 1719345600,
  "exp": 1719349200
}
```

**Fields**:
- `sub` (subject): Unique user ID (UUID from `users.id`)
- `email`: User email address
- `role`: One of: `user`, `curator`, `super_user`
- `iat`: Issued at (timestamp)
- `exp`: Expiration (timestamp)

#### Token Lifecycle

**1. Login Flow**
```
POST /api/auth/login { email, password }
  ↓
Backend validates credentials (email exists, password hashes match)
  ↓
Returns { accessToken, refreshToken }
  ↓
Frontend stores:
  - accessToken in memory (or httpOnly cookie)
  - refreshToken in httpOnly cookie (secure, not accessible to JavaScript)
```

**2. Access Token (Short-lived)**
- **Duration**: 15 minutes
- **Storage**: Memory (frontend) or httpOnly cookie
- **Usage**: Included in `Authorization: Bearer` header for all API calls
- **Refresh**: When expired, use refresh token to get new access token

**3. Refresh Token (Long-lived)**
- **Duration**: 7 days
- **Storage**: httpOnly cookie (not accessible via JavaScript)
- **Usage**: Only sent to `/api/auth/refresh-token` endpoint
- **Rotation**: Each refresh request returns a new refresh token (old token invalidated)
- **Security**: If compromise detected, user must login again

**4. Logout Flow**
```
POST /api/auth/logout
  ↓
Backend invalidates refresh token (adds to blacklist or marks as revoked)
  ↓
Frontend clears tokens from memory and cookies
```

### 1.2 Authorization (Permission Checking)

After verifying identity (via JWT), the system checks **what the user is allowed to do**.

#### Role Definitions

| Role | Description | Typical User |
|------|-------------|--------------|
| **Anonymous** | Not logged in | Site visitor |
| **user** | Authenticated, can create submissions | Contributor |
| **curator** | Can review and approve submissions | Moderator |
| **super_user** | Full administrative access | Admin |

#### Permission Matrix

| Resource | Anonymous | user | curator | super_user |
|----------|-----------|------|---------|-----------|
| **Read Events** | ✓ (public only) | ✓ (public + own) | ✓ (all) | ✓ (all) |
| **Create Event** | ✗ | ✓ (own) | ✓ (any) | ✓ (any) |
| **Edit Event** | ✗ | ✓ (own, pending) | ✓ (any) | ✓ (any) |
| **Delete Event** | ✗ | ✗ | ✗ | ✓ |
| **Approve Event** | ✗ | ✗ | ✓ (pending) | ✓ (any) |
| **Read Characters** | ✓ | ✓ | ✓ | ✓ |
| **Create Character** | ✗ | ✗ | ✓ | ✓ |
| **Edit Character** | ✗ | ✗ | ✓ | ✓ |
| **Read Places** | ✓ | ✓ | ✓ | ✓ |
| **Create Place** | ✗ | ✗ | ✓ | ✓ |
| **Admin Panel** | ✗ | ✗ | ✓ (read-only) | ✓ |
| **Manage Users** | ✗ | ✗ | ✗ | ✓ |

#### Authorization Implementation

Every API endpoint that modifies data must:

1. **Verify JWT** (middleware)
2. **Extract role** from token
3. **Check permission** for the operation

Example: `POST /api/events/:id/approve`
```typescript
// Step 1: Middleware verifies JWT
// Step 2: Extract role from token
const role = req.user.role;

// Step 3: Check permission
if (role !== 'curator' && role !== 'super_user') {
  return res.status(403).json({ error: 'Insufficient permissions' });
}

// Step 4: Proceed with approval logic
```

---

## 2. Data Protection

### 2.1 Encryption at Rest

#### Password Storage
- **Method**: bcryptjs with salt rounds = 12
- **Never stored in plain text**: All passwords hashed before database insert
- **One-way**: Cannot be decrypted; only compared via `bcrypt.compare()`

```typescript
// Backend storage
const hashedPassword = await bcryptjs.hash(plainTextPassword, 12);
// Store hashedPassword in database

// Login verification
const isValid = await bcryptjs.compare(loginPassword, storedHashedPassword);
```

#### Sensitive Data in Database
- **JWT Secrets**: Stored in environment variables, never in code or database
- **Email Addresses**: Stored in plaintext (needed for login); not encrypted
- **User Preferences**: Stored in plaintext (no sensitive data in preferences)
- **API Keys** (if any): Encrypted before storage; decrypted only when needed

#### Tokens in Database (if blacklist used)
- **Revoked Tokens**: If implementing token blacklist, store token hash (not plain token)
- **Expiration**: Old entries cleaned up automatically (job runs nightly)

### 2.2 Encryption in Transit

#### HTTPS/TLS
- **Production**: All API calls over HTTPS (enforced via nginx or reverse proxy)
- **Development**: HTTP acceptable (local Docker environment); HTTPS not required
- **Headers**: All responses include security headers

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

#### Cookie Security
- **httpOnly**: Cookies not accessible to JavaScript (prevents XSS theft)
- **Secure**: Cookies only sent over HTTPS (production)
- **SameSite**: Strict (prevents CSRF attacks)

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### 2.3 PII (Personally Identifiable Information)

| Data | Sensitivity | Protection |
|------|-------------|-----------|
| Email | Medium | Stored plaintext; no logging; validated before use |
| Password | High | Hashed with bcryptjs; never logged |
| JWT Token | High | Stored in memory (frontend) or httpOnly cookie; never logged |
| User ID | Low | Stored plaintext; publicly associated with events |
| User IP (if logged) | Medium | Logged only for security events; not retained > 30 days |

**Rules**:
- Never log passwords, tokens, or full email addresses
- Never send sensitive data in query parameters (use POST body or headers)
- No sensitive data in URLs (can be logged by proxies)

---

## 3. Input Validation & Output Encoding

### 3.1 Input Validation (Backend)

Every API endpoint **validates all inputs** before processing. Validation occurs in the **service layer**.

#### Validation Rules

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| **email** | string | RFC 5322 format, lowercase, max 255 chars | `user@example.com` |
| **password** | string | Min 8 chars, at least 1 uppercase, 1 number | `SecurePass123` |
| **eventTitle** | string | Max 200 chars, no HTML tags | `The Treaty of Westphalia` |
| **eventDescription** | string | Max 5000 chars, no `<script>` tags | `In 1648...` |
| **latitude** | number | Range -90 to 90 | `48.8566` |
| **longitude** | number | Range -180 to 180 | `2.3522` |
| **eventYear** | number | Range 1 to current year | `1648` |
| **userId** | UUID | Valid UUID v4 format | `550e8400-e29b-41d4-a716-446655440000` |

#### Implementation Pattern

```typescript
// Backend: EventService.validateEventInput()
function validateEventInput(input: any): Event {
  if (!input.title || typeof input.title !== 'string') {
    throw new ValidationError('Title is required and must be a string');
  }
  
  if (input.title.length > 200) {
    throw new ValidationError('Title must be less than 200 characters');
  }
  
  if (input.title.includes('<script>') || input.title.includes('</script>')) {
    throw new ValidationError('Title cannot contain HTML tags');
  }
  
  // ... validate other fields
  
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    latitude: parseFloat(input.latitude),
    longitude: parseFloat(input.longitude),
    // ...
  };
}
```

#### SQL Injection Prevention

**Always use parameterized queries**:

```typescript
// ✓ Safe: Parameterized query
const result = await db.query(
  'SELECT * FROM events WHERE id = $1 AND user_id = $2',
  [eventId, userId]
);

// ✗ Unsafe: String concatenation
const result = await db.query(
  `SELECT * FROM events WHERE id = ${eventId}`
);
```

### 3.2 Output Encoding (Frontend & Backend)

#### Frontend XSS Prevention

**React automatically escapes JSX**:
```typescript
// ✓ Safe: React escapes by default
const Title = ({ text }: { text: string }) => <h1>{text}</h1>;
// If text = "<img src=x onerror=alert('xss')>", it's rendered as-is (not executed)

// ✗ Unsafe: Explicitly using dangerouslySetInnerHTML
const Title = ({ html }: { html: string }) => 
  <h1 dangerouslySetInnerHTML={{ __html: html }} />;
// Only use if HTML is sanitized (see below)
```

**If HTML must be rendered** (e.g., rich text), use DOMPurify:
```typescript
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
);
```

#### Backend API Response

Always return clean, validated data:
```typescript
// ✓ Clean response
res.json({
  event: {
    id: event.id,
    title: event.title,  // Already validated on insert
    description: event.description,
    createdAt: event.created_at
  }
});

// ✗ Never return raw database rows with sensitive data
```

---

## 4. Rate Limiting & DoS Protection

### 4.1 Rate Limits

**Per IP Address** (general endpoints):
- 100 requests per 15 minutes
- Applies to: map data, timeline, read operations

**Per Authenticated User** (sensitive endpoints):
- 10 requests per 15 minutes for `/api/events` (create)
- 10 requests per 15 minutes for `/api/auth/login`
- 5 requests per 15 minutes for `/api/admin/*`

**Burst Protection**:
- If exceeded, return `429 Too Many Requests`
- Include `Retry-After` header

### 4.2 Implementation

```typescript
// Express middleware with rate-limit package
import rateLimit from 'express-rate-limit';

const createEventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests per window
  message: 'Too many events created; please try again later',
  standardHeaders: true,      // Return rate-limit info in headers
  legacyHeaders: false,
});

router.post('/events', createEventLimiter, createEventHandler);
```

### 4.3 DDoS Mitigation

- **Connection timeout**: 30 seconds (drop idle connections)
- **Request size limit**: Max 10 MB per request
- **Slowloris protection**: No chunk timeout > 30 seconds

---

## 5. Security Testing & Audit Logging

### 5.1 Security Testing Checklist

Before each release, verify:

- [ ] No SQL injection vulnerabilities (test with `' OR '1'='1`)
- [ ] No XSS vulnerabilities (test with `<img src=x onerror=alert(1)>`)
- [ ] Authentication required for protected endpoints
- [ ] Authorization enforced (user can't edit another user's events)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] CORS headers correct (no `*` for credentials)
- [ ] HTTPS headers present (Strict-Transport-Security, etc.)
- [ ] Rate limits working
- [ ] JWT expiration enforced
- [ ] Refresh token rotation working

### 5.2 Audit Logging

**What to Log** (backend):
- Login attempts (success & failure)
- Event approval/rejection (who approved, when)
- User role changes
- Event deletion (who deleted, what was deleted)
- Any API 401/403 errors

**What NOT to Log**:
- Passwords
- Full JWT tokens
- Email addresses (only user ID)
- Full request bodies (only relevant fields)

**Log Format**:
```json
{
  "timestamp": "2026-06-25T14:30:00Z",
  "event": "event_approved",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "resourceId": "660e8400-e29b-41d4-a716-446655440001",
  "status": 200,
  "duration": 123
}
```

**Retention**:
- Logs kept for 30 days minimum
- Security events (failed auth, permission denied) kept for 90 days

---

## 6. Known Vulnerabilities & Deprecations

### 6.1 Current Issues (Pre-Refactor)

| Issue | Severity | Fix |
|-------|----------|-----|
| JWT secret in hardcoded in backend/server.js | Critical | Move to `.env` file; regenerate all tokens |
| No rate limiting on login endpoint | High | Implement rate-limit middleware |
| Password validation too weak | High | Enforce min 8 chars, uppercase, number |
| No CORS headers | Medium | Add CORS middleware; restrict origins |
| Passwords logged in console.log | Critical | Remove all logging of sensitive data |
| No token refresh mechanism | Medium | Implement refresh token flow |

### 6.2 Security Headers (To Implement)

```typescript
// Express middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 6.3 Dependencies to Audit

Run monthly:
```bash
npm audit
```

Any critical vulnerabilities must be resolved before release.

---

## 7. Environment Variables (Sensitive)

Store in `.env` file (never commit to git):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/geohistory

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Backend
NODE_ENV=development
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Email (if sending notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=email-password
```

**Never log these values**; only use them at initialization time.

---

## 8. Compliance & Standards

### 8.1 OWASP Top 10 Coverage

| OWASP Issue | GeoHistory Mitigation |
|------------|----------------------|
| Injection | Parameterized queries, input validation |
| Broken Authentication | JWT + refresh tokens, password hashing |
| Sensitive Data Exposure | HTTPS, PII not logged, encrypted cookies |
| XML External Entities | Not applicable (no XML) |
| Broken Access Control | Role-based permissions, authorization checks |
| Security Misconfiguration | Security headers, environment variables |
| XSS | React escaping, DOMPurify for rich text |
| CSRF | SameSite cookies, CORS restrictions |
| Deserialization | No deserialization of untrusted data |
| Insufficient Logging | Audit logging of security events |

### 8.2 Password Requirements

- **Minimum length**: 8 characters
- **Character diversity**: At least 1 uppercase, 1 number, 1 special character recommended
- **No common passwords**: Check against list of top 100,000 passwords
- **No personal info**: Cannot contain email, username

---

## 9. Cross-References

- [Constitution.md](Constitution.md#61-modular-backend-vs-monolithic-serverjs) — Architecture for separation of concerns
- [Features.md](Features.md#5-api-specification) — All API endpoints include auth requirements
- [Operations.md](Operations.md#4-error-handling-standards) — Security event logging and error responses

---

## Appendix: Security Incident Response

If a security issue is discovered:

1. **Immediately disable affected feature** (if possible)
2. **Assess scope** (how many users affected?)
3. **Create patch** (fix the vulnerability)
4. **Deploy patch** (emergency release if critical)
5. **Audit logs** (check if vulnerability was exploited)
6. **Notify users** (if data was compromised)
7. **Document** (post-mortem analysis)

---

