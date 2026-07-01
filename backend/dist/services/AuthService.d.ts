/**
 * Auth Service
 * Handles user registration, login, token generation and refresh token revocation.
 */
import { User } from '@/types';
type SafeUser = Omit<User, 'password_hash'> & {
    role: 'user' | 'curator' | 'super_user';
};
interface AccessTokenPayload {
    sub: string;
    id: string;
    email: string;
    role: 'user' | 'curator' | 'super_user';
}
interface RefreshTokenPayload extends AccessTokenPayload {
    type: 'refresh';
    jti: string;
    iat?: number;
    exp?: number;
}
export declare class AuthService {
    register(email: string, password: string, fullName?: string): Promise<{
        user: SafeUser;
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        user: SafeUser;
        accessToken: string;
        refreshToken: string;
    }>;
    verifyToken(token: string): AccessTokenPayload;
    generateAccessToken(userId: string, email: string, role: 'user' | 'curator' | 'super_user'): string;
    generateRefreshToken(userId: string, email: string, role: 'user' | 'curator' | 'super_user'): string;
    verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
    revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void>;
    persistRefreshToken(token: string, userId: string): Promise<void>;
    private hashToken;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=AuthService.d.ts.map