/**
 * Central type definitions for GeoHistory backend
 * All shared interfaces and types defined here
 * See specs/Features.md § 3 for API contract details
 */

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'user' | 'curator' | 'super_user';
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  user_id: string;
  frame_id?: string | null;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  event_date: Date;
  end_date?: Date;
  lat: number;
  lng: number;
  characters?: Array<string | { id?: string; name: string }>;
  // Backward-compat fields for mixed payloads while refactor stabilizes.
  start_date?: Date;
  latitude?: number;
  longitude?: number;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Character {
  id: string;
  name: string;
  alias?: string;
  description: string;
  image_url?: string;
  frame_id?: string | null;
  frame_ids?: string[];
  birth_date?: Date;
  death_date?: Date;
  face_crop_x?: number;
  face_crop_y?: number;
  face_crop_scale?: number;
  face_crop_size?: number;
  updated_at?: Date;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  place_type_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlaceType {
  id: string;
  name: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
}

export interface HistoricalFrame {
  id: string;
  title: string;
  description: string;
  start_year: number;
  end_year?: number;
  created_at: Date;
  updated_at: Date;
}

export interface EventCharacter {
  event_id: string;
  character_id: string;
  role: string;
  created_at: Date;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at?: Date;
  replaced_by_token_id?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// API CONTRACTS
// ============================================================================

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'password_hash'>;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status_code: number;
  timestamp: string;
  path?: string;
}

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

export interface CreateEventRequest {
  title: string;
  description: string;
  event_date?: string; // ISO 8601 format
  start_date?: string; // Backward compatibility
  end_date?: string;
  frame_id?: string | null;
  characters?: Array<string | { id?: string; name: string }>;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_date?: string;
  start_date?: string;
  end_date?: string;
  frame_id?: string | null;
  characters?: Array<string | { id?: string; name: string }>;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export interface ApproveEventRequest {
  notes?: string;
}

export interface RejectEventRequest {
  reason: string;
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: 'user' | 'curator' | 'super_user';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// LOGGING
// ============================================================================

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  path?: string;
  user_id?: string;
  request_id?: string;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}
