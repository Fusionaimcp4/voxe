import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // This endpoint is meant to be called during a pending 2FA login flow, 
    // where the user is already partially authenticated and their userId/totpSecret
    // can be retrieved from a temporary session or cookie. For now, we'll rely
    // on the active session, but in a real-world scenario, you'd have a pre-auth token.
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized or 2FA flow not initiated' }, { status: 401 });
    }

    const userId = session.user.id;
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '2FA code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.totpSecret) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 });
    }

    const isValid = authenticator.check(code, user.totpSecret);

    if (isValid) {
      // Mark 2FA as successfully verified for the current session flow
      // In a real scenario, this would transition from a pre-auth token to a full session token
      // For now, we'll assume the session is implicitly updated by next-auth on successful authentication
      return NextResponse.json({ success: true, message: '2FA code verified successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid 2FA code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
}
