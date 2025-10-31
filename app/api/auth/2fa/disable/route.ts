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
    const { code } = await request.json();

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access Denied: Only admins can disable 2FA' }, { status: 403 });
    }

    if (!code) {
      return NextResponse.json({ error: '2FA code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.totpSecret) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 });
    }

    // Verify the TOTP code before disabling
    const isValid = authenticator.check(code, user.totpSecret);

    if (isValid) {
      // Clear the TOTP secret from the user's database record
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
        },
      });

      // Trigger session update to reflect 2FA status

      return NextResponse.json({ success: true, message: '2FA disabled successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid 2FA code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
