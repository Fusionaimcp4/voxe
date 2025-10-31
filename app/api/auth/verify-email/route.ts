import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/tokens';

// Helper to get base URL for redirects
function getBaseUrl(request: NextRequest): string {
  // Try environment variables first (most reliable)
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fall back to request URL (may be internal Docker URL)
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const userId = searchParams.get('uid');

  const baseUrl = getBaseUrl(request);

  if (!token || !userId) {
    return NextResponse.redirect(new URL('/auth/signin?error=Invalid verification link', baseUrl));
  }

  try {
    if (!prisma) {
      return NextResponse.redirect(new URL('/auth/signin?error=Database not available', baseUrl));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=User not found', baseUrl));
    }

    const isTokenValid = await consumeVerificationToken(userId, token, 'email_verify');

    if (isTokenValid) {
      // Update user verification status
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Note: Fusion sub-account creation moved to demo creation process
      // This ensures all users (including OAuth) get Fusion sub-accounts when needed
      console.log(`✅ [Email Verification] User ${user.id} (${user.email}) email verified successfully`);

      return NextResponse.redirect(new URL('/auth/signin?message=Email successfully verified. You can now sign in.', baseUrl));
    } else {
      return NextResponse.redirect(new URL('/auth/signin?error=Invalid or expired verification token', baseUrl));
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=An unexpected error occurred during verification', baseUrl));
  }
}
