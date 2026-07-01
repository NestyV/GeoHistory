# GeoHistory Features Specification

*Last Updated: 2026-06-25*

**Related Specs**: [Constitution.md](Constitution.md) defines architecture; [Security.md](Security.md) defines permissions; [Design.md](Design.md) defines components; [Operations.md](Operations.md) covers error handling.

---

## 1. Feature Overview & User Roles

### 1.1 User Role Capabilities

#### Anonymous User (Not Logged In)
- View public events on map
- View historical timeline
- Read character and place information
- Cannot create or modify data

#### Authenticated User (role: `user`)
- All anonymous capabilities +
- Create new event submissions
- View own submitted events
- Edit own events (while pending approval)
- Cannot approve events or manage other users' data

#### Curator (role: `curator`)
- All user capabilities +
- Review pending event submissions
- Approve or reject events
- Create characters, places, historical frames
- Edit any event or entity
- View admin dashboard (read-only mode)
- Cannot delete events or manage users

#### Super User (role: `super_user`)
- All curator capabilities +
- Delete events, characters, places
- Manage user roles and permissions
- Full admin panel access
- Manage historical frames

---

## 2. Core Features

### 2.1 Event Management Workflow

An **Event** represents a historical happening at a specific location, date, and involves characters.

#### Event Submission Flow

```
1. User submits event via Map interface (right-click)
   └─ Title, description, location (lat/lon), date (year)

2. Event stored with status = "pending"
   └─ Assigned to current user_id

3. Curator reviews in Admin Panel
   └─ Reads full event, linked characters

4. Curator approves or rejects
   └─ If approved: status = "approved", visible on public map
   └─ If rejected: status = "rejected", reason stored

5. User notified of decision
   └─ Email optional (future feature)
```

#### Event Attributes

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | UUID | ✓ | Auto-generated |
| user_id | UUID | ✓ | Creator of event |
| title | string | ✓ | Max 200 chars |
| description | string | ✓ | Max 5000 chars |
| latitude | number | ✓ | -90 to 90 |
| longitude | number | ✓ | -180 to 180 |
| year | number | ✓ | 1 to current year |
| status | enum | ✓ | pending, approved, rejected |
| historical_frame_id | UUID | ✗ | Links to historical period |
| created_at | timestamp | ✓ | ISO 8601 |
| updated_at | timestamp | ✓ | ISO 8601 |
| approved_by | UUID | ✗ | ID of curator who approved |
| approved_at | timestamp | ✗ | When approved |
| rejection_reason | string | ✗ | Why rejected (max 500 chars) |

### 2.2 Character Management

A **Character** is a historical figure involved in events.

#### Character Attributes

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | UUID | ✓ | Auto-generated |
| name | string | ✓ | Max 200 chars |
| birth_year | number | ✗ | 1 to current year |
| death_year | number | ✗ | 1 to current year |
| description | string | ✗ | Max 2000 chars |
| image_url | string | ✗ | URL to character image |
| wikipedia_url | string | ✗ | Link to Wikipedia article |
| created_at | timestamp | ✓ | ISO 8601 |
| updated_at | timestamp | ✓ | ISO 8601 |

#### Character-Event Relationship

An event can involve multiple characters; a character can appear in multiple events.

- **Linking**: When creating/editing an event, curator can add characters
- **View**: Event detail shows all linked characters with images

### 2.3 Places & Place Types

A **Place** is a geographic location (city, country, building, etc.).

A **Place Type** categorizes places (city, country, monument, etc.).

#### Place Attributes

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | UUID | ✓ | Auto-generated |
| name | string | ✓ | Max 200 chars |
| latitude | number | ✓ | -90 to 90 |
| longitude | number | ✓ | -180 to 180 |
| place_type_id | UUID | ✓ | Foreign key to place_types |
| description | string | ✗ | Max 2000 chars |
| wikipedia_url | string | ✗ | Link to Wikipedia |
| created_at | timestamp | ✓ | ISO 8601 |

#### Place Type Attributes

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | UUID | ✓ | Auto-generated |
| name | string | ✓ | city, country, monument, etc. |
| color | string | ✗ | Hex color for map markers (e.g., #FF0000) |

### 2.4 Historical Frames

A **Historical Frame** groups events into periods (e.g., "Medieval Period", "Renaissance").

#### Historical Frame Attributes

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | UUID | ✓ | Auto-generated |
| name | string | ✓ | Medieval Period, Renaissance, etc. |
| start_year | number | ✓ | 1 to current year |
| end_year | number | ✓ | Must be >= start_year |
| description | string | ✗ | Max 2000 chars |
| color | string | ✗ | Hex color for timeline (e.g., #8B0000) |

#### Timeline Filtering

Users can filter events by historical frame on the timeline view.

---

## 3. API Specification

### 3.1 Authentication Endpoints

#### POST /api/auth/login
Create user session.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401)**:
```json
{
  "error": "Invalid email or password"
}
```

---

#### POST /api/auth/register
Create new user account.

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123"
}
```

**Response (201)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "role": "user"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Response (400)**:
```json
{
  "error": "Email already exists"
}
```

---

#### POST /api/auth/refresh-token
Get new access token using refresh token.

**Request** (refresh token sent via httpOnly cookie):
```
POST /api/auth/refresh-token
```

**Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401)**:
```json
{
  "error": "Refresh token expired or invalid"
}
```

---

#### POST /api/auth/logout
Invalidate refresh token.

**Request**:
```
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

#### GET /api/auth/me
Get current user profile.

**Request**:
```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Response (200)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2026-06-01T10:00:00Z"
  }
}
```

**Response (401)**:
```json
{
  "error": "Unauthorized"
}
```

---

### 3.2 Event Endpoints

#### GET /api/events
List all approved events (public map data).

**Query Parameters**:
- `limit` (number, default: 100, max: 1000) — Results per page
- `offset` (number, default: 0) — Pagination offset
- `year_min` (number, optional) — Filter by minimum year
- `year_max` (number, optional) — Filter by maximum year
- `frame_id` (UUID, optional) — Filter by historical frame

**Request**:
```
GET /api/events?limit=50&offset=0&year_min=1600&year_max=1700
```

**Response (200)**:
```json
{
  "events": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Treaty of Westphalia",
      "description": "Peace treaty ending...",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "year": 1648,
      "status": "approved",
      "created_at": "2026-06-01T10:00:00Z",
      "approved_at": "2026-06-02T14:30:00Z"
    }
  ],
  "total": 1500,
  "limit": 50,
  "offset": 0
}
```

---

#### GET /api/events/:id
Get single event detail.

**Request**:
```
GET /api/events/660e8400-e29b-41d4-a716-446655440001
```

**Response (200)**:
```json
{
  "event": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Treaty of Westphalia",
    "description": "Peace treaty ending the Thirty Years' War...",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "year": 1648,
    "status": "approved",
    "historical_frame_id": "770e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-06-01T10:00:00Z",
    "approved_at": "2026-06-02T14:30:00Z",
    "characters": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "Louis XIV",
        "birth_year": 1638,
        "death_year": 1715,
        "image_url": "https://example.com/louis.jpg"
      }
    ]
  }
}
```

**Response (404)**:
```json
{
  "error": "Event not found"
}
```

---

#### POST /api/events
Create new event (authenticated users only).

**Request**:
```json
{
  "title": "Battle of Hastings",
  "description": "Norman invasion of England...",
  "latitude": 50.8500,
  "longitude": 0.9113,
  "year": 1066,
  "historical_frame_id": "770e8400-e29b-41d4-a716-446655440002",
  "character_ids": ["880e8400-e29b-41d4-a716-446655440003"]
}
```

**Response (201)**:
```json
{
  "event": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Battle of Hastings",
    "description": "Norman invasion of England...",
    "latitude": 50.8500,
    "longitude": 0.9113,
    "year": 1066,
    "status": "pending",
    "created_at": "2026-06-25T12:00:00Z"
  }
}
```

**Response (400)**:
```json
{
  "error": "Validation failed: title is required"
}
```

**Response (401)**:
```json
{
  "error": "Unauthorized"
}
```

---

#### PATCH /api/events/:id
Update event (creator or curator only).

**Request**:
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response (200)**:
```json
{
  "event": { /* updated event */ }
}
```

**Response (403)**:
```json
{
  "error": "Only event creator or curator can edit"
}
```

---

#### POST /api/events/:id/approve
Approve event (curator or super_user only).

**Request**:
```json
{
  "message": "Looks good!"
}
```

**Response (200)**:
```json
{
  "event": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "approved",
    "approved_by": "550e8400-e29b-41d4-a716-446655440000",
    "approved_at": "2026-06-25T14:30:00Z"
  }
}
```

**Response (403)**:
```json
{
  "error": "Only curators can approve events"
}
```

---

#### POST /api/events/:id/reject
Reject event (curator or super_user only).

**Request**:
```json
{
  "rejection_reason": "Needs more historical context"
}
```

**Response (200)**:
```json
{
  "event": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "rejected",
    "rejection_reason": "Needs more historical context"
  }
}
```

---

#### DELETE /api/events/:id
Delete event (super_user only).

**Request**:
```
DELETE /api/events/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {accessToken}
```

**Response (204)**:
```
(no content)
```

**Response (403)**:
```json
{
  "error": "Only super users can delete events"
}
```

---

### 3.3 Character Endpoints

#### GET /api/characters
List all characters.

**Query Parameters**:
- `limit` (number, default: 100)
- `offset` (number, default: 0)
- `search` (string, optional) — Search by name

**Request**:
```
GET /api/characters?search=Louis
```

**Response (200)**:
```json
{
  "characters": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Louis XIV",
      "birth_year": 1638,
      "death_year": 1715,
      "image_url": "https://example.com/louis.jpg"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

#### GET /api/characters/:id
Get character detail with linked events.

**Request**:
```
GET /api/characters/880e8400-e29b-41d4-a716-446655440003
```

**Response (200)**:
```json
{
  "character": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Louis XIV",
    "birth_year": 1638,
    "death_year": 1715,
    "description": "The Sun King, longest-reigning European monarch...",
    "image_url": "https://example.com/louis.jpg",
    "wikipedia_url": "https://en.wikipedia.org/wiki/Louis_XIV",
    "events": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Treaty of Westphalia",
        "year": 1648
      }
    ]
  }
}
```

---

#### POST /api/characters
Create character (curator or super_user only).

**Request**:
```json
{
  "name": "Marie Antoinette",
  "birth_year": 1755,
  "death_year": 1793,
  "description": "Queen of France...",
  "image_url": "https://example.com/marie.jpg",
  "wikipedia_url": "https://en.wikipedia.org/wiki/Marie_Antoinette"
}
```

**Response (201)**:
```json
{
  "character": { /* new character */ }
}
```

---

#### PATCH /api/characters/:id
Update character (curator or super_user only).

**Request**:
```json
{
  "description": "Updated description"
}
```

**Response (200)**:
```json
{
  "character": { /* updated character */ }
}
```

---

### 3.4 Places Endpoints

#### GET /api/places
List all places.

**Query Parameters**:
- `limit` (number, default: 100)
- `offset` (number, default: 0)
- `place_type_id` (UUID, optional) — Filter by type

**Request**:
```
GET /api/places?place_type_id=aa0e8400-e29b-41d4-a716-446655440099
```

**Response (200)**:
```json
{
  "places": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440099",
      "name": "Paris",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "place_type_id": "aa0e8400-e29b-41d4-a716-446655440099",
      "description": "Capital of France..."
    }
  ],
  "total": 15,
  "limit": 100,
  "offset": 0
}
```

---

#### POST /api/places
Create place (curator or super_user only).

**Request**:
```json
{
  "name": "Versailles",
  "latitude": 48.8047,
  "longitude": 2.1201,
  "place_type_id": "aa0e8400-e29b-41d4-a716-446655440098",
  "description": "Royal palace in France...",
  "wikipedia_url": "https://en.wikipedia.org/wiki/Palace_of_Versailles"
}
```

**Response (201)**:
```json
{
  "place": { /* new place */ }
}
```

---

### 3.5 Place Types Endpoints

#### GET /api/place-types
List all place types.

**Request**:
```
GET /api/place-types
```

**Response (200)**:
```json
{
  "place_types": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440099",
      "name": "city",
      "color": "#FF0000"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440098",
      "name": "monument",
      "color": "#00FF00"
    }
  ]
}
```

---

#### POST /api/place-types
Create place type (curator or super_user only).

**Request**:
```json
{
  "name": "castle",
  "color": "#8B0000"
}
```

**Response (201)**:
```json
{
  "place_type": { /* new place type */ }
}
```

---

### 3.6 Historical Frames Endpoints

#### GET /api/frames
List all historical frames.

**Request**:
```
GET /api/frames
```

**Response (200)**:
```json
{
  "frames": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Renaissance",
      "start_year": 1300,
      "end_year": 1600,
      "description": "Period of cultural rebirth...",
      "color": "#FF6347"
    }
  ]
}
```

---

#### POST /api/frames
Create historical frame (curator or super_user only).

**Request**:
```json
{
  "name": "Industrial Revolution",
  "start_year": 1760,
  "end_year": 1840,
  "description": "Era of mechanization and industrialization...",
  "color": "#4169E1"
}
```

**Response (201)**:
```json
{
  "frame": { /* new frame */ }
}
```

---

### 3.7 Admin Endpoints

#### GET /api/admin/pending-events
List all pending events for review (curator/super_user only).

**Request**:
```
GET /api/admin/pending-events
Authorization: Bearer {accessToken}
```

**Response (200)**:
```json
{
  "events": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Event Title",
      "created_at": "2026-06-25T10:00:00Z",
      "status": "pending"
    }
  ],
  "total": 23
}
```

---

#### GET /api/admin/users
List all users (super_user only).

**Request**:
```
GET /api/admin/users
Authorization: Bearer {accessToken}
```

**Response (200)**:
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-06-01T10:00:00Z"
    }
  ],
  "total": 42
}
```

---

#### PATCH /api/admin/users/:id/role
Change user role (super_user only).

**Request**:
```json
{
  "role": "curator"
}
```

**Response (200)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "curator"
  }
}
```

---

### 3.8 Health & Status

#### GET /api/health
Health check endpoint (no authentication required).

**Request**:
```
GET /api/health
```

**Response (200)**:
```json
{
  "status": "ok",
  "timestamp": "2026-06-25T14:30:00Z",
  "database": "connected"
}
```

---

## 4. Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  historical_frame_id UUID REFERENCES historical_frames(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT
);

-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  birth_year INTEGER,
  death_year INTEGER,
  description TEXT,
  image_url VARCHAR(500),
  wikipedia_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event-Character relationships
CREATE TABLE event_characters (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, character_id)
);

-- Places
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  place_type_id UUID NOT NULL REFERENCES place_types(id),
  description TEXT,
  wikipedia_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Place Types
CREATE TABLE place_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Frames
CREATE TABLE historical_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_year ON events(year);
CREATE INDEX idx_events_historical_frame_id ON events(historical_frame_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_places_place_type_id ON places(place_type_id);
```

---

## 5. Error Responses

### 5.1 Standard Error Format

All errors return this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### 5.2 HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists |
| 422 | Unprocessable Entity | Validation failed with details |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### 5.3 Common Error Responses

**Validation Error (400)**:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title must be less than 200 characters",
    "year": "Year must be between 1 and 2026"
  }
}
```

**Unauthorized (401)**:
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Permission Denied (403)**:
```json
{
  "error": "Only event creator or curator can edit",
  "code": "PERMISSION_DENIED"
}
```

**Not Found (404)**:
```json
{
  "error": "Event not found",
  "code": "NOT_FOUND"
}
```

---

## 6. Pagination & Filtering Standards

### 6.1 Pagination Query Parameters

All list endpoints support:
- `limit` (default: 50, max: 1000) — Results per page
- `offset` (default: 0) — Number of results to skip

**Example**:
```
GET /api/events?limit=25&offset=50
```

**Response includes**:
```json
{
  "events": [...],
  "total": 1500,
  "limit": 25,
  "offset": 50
}
```

### 6.2 Sorting

Endpoints support `sort` parameter:
- Format: `{field}` or `-{field}` (for descending)

**Example**:
```
GET /api/events?sort=-created_at
```

### 6.3 Filtering

Common filters:
- `search` (string) — Full-text search
- `status` (enum) — For events: pending, approved, rejected
- `year_min`, `year_max` (number) — Date range
- `frame_id` (UUID) — Filter by historical frame

---

## 7. Cross-References

- [Security.md](Security.md#12-authorization-permission-checking) — Permission matrix
- [Design.md](Design.md) — Component implementations for these features
- [Operations.md](Operations.md) — Error handling and logging

---

