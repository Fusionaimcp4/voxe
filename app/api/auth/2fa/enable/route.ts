import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { secret, code } = await request.json();

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access Denied: Only admins can enable 2FA' }, { status: 403 });
    }

    if (!secret || !code) {
      return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 });
    }

    // Verify the TOTP code
    const isValid = authenticator.check(code, secret);

    if (isValid) {
      // Save the secret to the user's database record
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
        },
      });

      // Trigger session update to include 2FA status (if applicable)
      // This will be handled by the jwt callback 'update' trigger

      return NextResponse.json({ success: true, message: '2FA enabled successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid 2FA code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
