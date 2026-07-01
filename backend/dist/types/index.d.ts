/**
 * Central type definitions for GeoHistory backend
 * All shared interfaces and types defined here
 * See specs/Features.md § 3 for API contract details
 */
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
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    start_date: Date;
    end_date?: Date;
    location: string;
    latitude: number;
    longitude: number;
    created_at: Date;
    updated_at: Date;
}
export interface Character {
    id: string;
    name: string;
    description: string;
    birth_date?: Date;
    death_date?: Date;
    created_at: Date;
    updated_at: Date;
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
export interface CreateEventRequest {
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    location: string;
    latitude: number;
    longitude: number;
}
export interface UpdateEventRequest {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
}
export interface ApproveEventRequest {
    notes?: string;
}
export interface RejectEventRequest {
    reason: string;
}
export interface JWTPayload {
    sub: string;
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
//# sourceMappingURL=index.d.ts.map