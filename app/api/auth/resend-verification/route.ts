import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueVerificationToken } from '@/lib/tokens';
import { sendEmail, loadEmailTemplate } from '@/lib/mailer';
import { rateLimiter } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email || session.user.isVerified) {
      return NextResponse.json({ error: 'Unauthorized or already verified' }, { status: 400 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || 'there';
    const ip = request.headers.get('x-forwarded-for') || request.ip;

    // Rate limit resend requests
    const rateLimitKey = `resend_verification:${userId}`;
    const resendRateLimit = await rateLimiter(rateLimitKey, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 2, // Max 2 resend requests per 5 minutes per user
      message: 'Too many resend verification requests. Please wait a few minutes.'
    });

    if (!resendRateLimit.success) {
      return NextResponse.json({ error: resendRateLimit.message }, { status: 429 });
    }

    // Invalidate any existing email verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: userId,
        type: 'email_verify',
      },
    });

    // Issue new email verification token
    const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const { rawToken, expiresAt } = await issueVerificationToken(userId, 'email_verify', VERIFICATION_TOKEN_TTL_MS);

    // Send verification email
    const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/verify?token=${rawToken}&uid=${userId}`;
    const expiryHours = VERIFICATION_TOKEN_TTL_MS / (1000 * 60 * 60);
    const emailHtml = await loadEmailTemplate('verify-email', {
      userName,
      verificationLink,
      expiryHours: expiryHours.toString(),
      currentYear: new Date().getFullYear().toString(),
    });

    await sendEmail({
      to: userEmail,
      subject: 'Verify Your Email Address for Localbox',
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'Verification email re-sent successfully. Please check your inbox.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
