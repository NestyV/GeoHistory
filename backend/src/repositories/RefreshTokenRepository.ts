/**
 * Refresh Token Repository
 * Persistence for refresh token rotation and revocation.
 */

import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';
import { RefreshTokenRecord } from '@/types';

export class RefreshTokenRepository {
  async createToken(record: {
    userId: string;
    tokenId: string;
    expiresAt: Date;
    tokenHash: string;
  }): Promise<RefreshTokenRecord> {
    try {
      const result = await query<RefreshTokenRecord>(
        `INSERT INTO refresh_tokens (user_id, token_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [record.userId, record.tokenId, record.tokenHash, record.expiresAt],
      );
      return result.rows[0]!;
    } catch (error) {
      defaultLogger.error('Error creating refresh token record', error as Error);
      throw error;
    }
  }

  async revokeToken(tokenId: string, replacedByTokenId?: string): Promise<void> {
    try {
      await query(
        `UPDATE refresh_tokens
         SET revoked_at = NOW(),
             replaced_by_token_id = COALESCE($2, replaced_by_token_id)
         WHERE token_id = $1 AND revoked_at IS NULL`,
        [tokenId, replacedByTokenId || null],
      );
    } catch (error) {
      defaultLogger.error('Error revoking refresh token', error as Error);
      throw error;
    }
  }

  async isTokenActive(tokenId: string): Promise<boolean> {
    try {
      const result = await query<{ active: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM refresh_tokens
           WHERE token_id = $1
             AND revoked_at IS NULL
             AND expires_at > NOW()
         ) AS active`,
        [tokenId],
      );
      return Boolean(result.rows[0]?.active);
    } catch (error) {
      defaultLogger.error('Error checking refresh token state', error as Error);
      throw error;
    }
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
