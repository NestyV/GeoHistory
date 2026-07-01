"use strict";
/**
 * Refresh Token Repository
 * Persistence for refresh token rotation and revocation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenRepository = exports.RefreshTokenRepository = void 0;
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class RefreshTokenRepository {
    async createToken(record) {
        try {
            const result = await (0, database_1.query)(`INSERT INTO refresh_tokens (user_id, token_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`, [record.userId, record.tokenId, record.tokenHash, record.expiresAt]);
            return result.rows[0];
        }
        catch (error) {
            logger_1.defaultLogger.error('Error creating refresh token record', error);
            throw error;
        }
    }
    async revokeToken(tokenId, replacedByTokenId) {
        try {
            await (0, database_1.query)(`UPDATE refresh_tokens
         SET revoked_at = NOW(),
             replaced_by_token_id = COALESCE($2, replaced_by_token_id)
         WHERE token_id = $1 AND revoked_at IS NULL`, [tokenId, replacedByTokenId || null]);
        }
        catch (error) {
            logger_1.defaultLogger.error('Error revoking refresh token', error);
            throw error;
        }
    }
    async isTokenActive(tokenId) {
        try {
            const result = await (0, database_1.query)(`SELECT EXISTS (
           SELECT 1
           FROM refresh_tokens
           WHERE token_id = $1
             AND revoked_at IS NULL
             AND expires_at > NOW()
         ) AS active`, [tokenId]);
            return Boolean(result.rows[0]?.active);
        }
        catch (error) {
            logger_1.defaultLogger.error('Error checking refresh token state', error);
            throw error;
        }
    }
}
exports.RefreshTokenRepository = RefreshTokenRepository;
exports.refreshTokenRepository = new RefreshTokenRepository();
//# sourceMappingURL=RefreshTokenRepository.js.map