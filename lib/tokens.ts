import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface GeneratedToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Generates a raw token, hashes it, and sets an expiry.
 */
export function createHashedToken(length: number = 32, expiryMs: number): GeneratedToken {
  const rawToken = crypto.randomBytes(length).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryMs);
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Hashes a raw token using SHA256.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Issues a verification token and stores its hash in the database.
 */
export async function issueVerificationToken(
  userId: string,
  type: 'email_verify' | 'password_reset',
  ttlMs: number
): Promise<GeneratedToken> {
  const { rawToken, tokenHash, expiresAt } = createHashedToken(32, ttlMs);

  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      type,
      expiresAt,
    },
  });

  return { rawToken, tokenHash, expiresAt };
}

/**
 * Consumes a verification token:
 *  - Verifies the raw token against the stored hash.
 *  - Checks expiry.
 *  - Deletes the token upon successful consumption.
 *  - Uses constant-time comparison for security.
 */
export async function consumeVerificationToken(
  userId: string,
  rawToken: string,
  type: 'email_verify' | 'password_reset'
): Promise<boolean> {
  const tokens = await prisma.verificationToken.findMany({
    where: { userId, type, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  for (const storedToken of tokens) {
    const expectedHash = hashToken(rawToken);

    // Constant-time comparison for security
    const hashBuffer = Buffer.from(storedToken.tokenHash);
    const expectedHashBuffer = Buffer.from(expectedHash);

    if (hashBuffer.length === expectedHashBuffer.length &&
        crypto.timingSafeEqual(hashBuffer, expectedHashBuffer)) {
      
      // Token matched and not expired, consume it
      await prisma.verificationToken.delete({ where: { id: storedToken.id } });
      return true;
    }
  }

  return false; // No valid token found or matched
}






