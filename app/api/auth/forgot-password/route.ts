import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueVerificationToken } from '@/lib/tokens';
import { sendEmail, loadEmailTemplate } from '@/lib/mailer';
import { rateLimiter } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.ip;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limit password reset requests by IP and email
    const ipRateLimitKey = `forgot_password_ip:${ip}`;
    const emailRateLimitKey = `forgot_password_email:${email}`;

    const ipRateLimit = await rateLimiter(ipRateLimitKey, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5, // 5 requests per 5 minutes per IP
      message: 'Too many password reset requests from this IP. Please try again later.'
    });
    if (!ipRateLimit.success) {
      return NextResponse.json({ error: ipRateLimit.message }, { status: 429 });
    }

    const emailRateLimit = await rateLimiter(emailRateLimitKey, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 3, // 3 requests per 5 minutes per email
      message: 'Too many password reset requests for this email. Please check your inbox or try again later.'
    });
    if (!emailRateLimit.success) {
      return NextResponse.json({ error: emailRateLimit.message }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return a success message to prevent email enumeration attacks
    if (!user || !user.isVerified) {
      console.warn(`Attempted password reset for non-existent or unverified email: ${email}`);
      return NextResponse.json(
        { message: 'If an account with that email exists and is verified, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Invalidate any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'password_reset',
      },
    });

    const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
    const { rawToken, expiresAt } = await issueVerificationToken(user.id, 'password_reset', RESET_TOKEN_TTL_MS);

    const resetLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${rawToken}&uid=${user.id}`;
    const expiryMinutes = RESET_TOKEN_TTL_MS / (1000 * 60);
    const emailHtml = await loadEmailTemplate('reset-password', {
      userName: user.name || 'there',
      resetLink,
      expiryMinutes: expiryMinutes.toString(),
      currentYear: new Date().getFullYear().toString(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Localbox Password',
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'If an account with that email exists and is verified, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
