import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { consumeVerificationToken } from '@/lib/tokens';
import { enforcePasswordPolicy, checkPwnedPassword } from '@/lib/passwordPolicy';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, newPassword } = await request.json();

    if (!userId || !token || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, token, and new password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isTokenValid = await consumeVerificationToken(userId, token, 'password_reset');

    if (!isTokenValid) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Enforce password policy
    const { isValid, errors } = enforcePasswordPolicy(newPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: `Password policy violation: ${errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Check against pwned passwords (stubbed for now)
    if (await checkPwnedPassword(newPassword)) {
      return NextResponse.json(
        { error: 'This password has been found in data breaches. Please choose a different password.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all other password reset tokens for this user for extra security
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'password_reset',
      },
    });

    return NextResponse.json(
      { message: 'Password reset successfully. You can now sign in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
