import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email || !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name;

    // Check if user is ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access Denied: Only admins can setup 2FA' }, { status: 403 });
    }

    // Generate a new TOTP secret
    const secret = authenticator.generateSecret();

    // Generate the OTPAuth URL for the QR code
    const appName = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'Localbox';
    const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

    // Generate QR code data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Store the secret temporarily (or in session) until it's verified and enabled
    // For now, we'll return it and expect the client to use it for /2fa/enable
    return NextResponse.json(
      {
        success: true,
        secret,
        otpauthUrl,
        qrCodeDataUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    );
  }
}
