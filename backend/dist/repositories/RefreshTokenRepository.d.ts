/**
 * Refresh Token Repository
 * Persistence for refresh token rotation and revocation.
 */
import { RefreshTokenRecord } from '@/types';
export declare class RefreshTokenRepository {
    createToken(record: {
        userId: string;
        tokenId: string;
        expiresAt: Date;
        tokenHash: string;
    }): Promise<RefreshTokenRecord>;
    revokeToken(tokenId: string, replacedByTokenId?: string): Promise<void>;
    isTokenActive(tokenId: string): Promise<boolean>;
}
export declare const refreshTokenRepository: RefreshTokenRepository;
//# sourceMappingURL=RefreshTokenRepository.d.ts.map