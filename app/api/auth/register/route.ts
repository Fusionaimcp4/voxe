import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { issueVerificationToken } from '@/lib/tokens';
import { sendEmail, loadEmailTemplate } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { name, email, company, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with isVerified: false
    const user = await prisma.user.create({
      data: {
        name,
        email,
        company: company || null,
        password: hashedPassword,
        role: 'USER',
        isVerified: false, // New users are unverified by default
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Issue email verification token
    const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const { rawToken, expiresAt } = await issueVerificationToken(user.id, 'email_verify', VERIFICATION_TOKEN_TTL_MS);

    // Send verification email
    const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${rawToken}&uid=${user.id}`;
    const expiryHours = VERIFICATION_TOKEN_TTL_MS / (1000 * 60 * 60);
    const emailHtml = await loadEmailTemplate('verify-email', {
      userName: user.name || 'there',
      verificationLink,
      expiryHours: expiryHours.toString(),
      currentYear: new Date().getFullYear().toString(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address for Localbox',
      html: emailHtml,
    });

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        user: { ...user, isVerified: false } // Explicitly return isVerified: false
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
