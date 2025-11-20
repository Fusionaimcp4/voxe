import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

// GET - Get 2FA status or setup QR code
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email || !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });

    const has2FA = !!user?.totpSecret;

    // If 2FA is already enabled, just return status
    if (has2FA) {
      return NextResponse.json({
        has2FA: true,
        message: '2FA is enabled',
      });
    }

    // Generate a new TOTP secret for setup
    const secret = authenticator.generateSecret();

    // Generate the OTPAuth URL for the QR code
    const appName = process.env.APP_NAME || (process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'Voxe');
    const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

    // Generate QR code data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return NextResponse.json({
      has2FA: false,
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    );
  }
}

// POST - Enable or disable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, secret, code } = body;

    if (!action || (action !== 'enable' && action !== 'disable')) {
      return NextResponse.json(
        { error: 'Action must be "enable" or "disable"' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });

    if (action === 'enable') {
      if (!secret || !code) {
        return NextResponse.json(
          { error: 'Secret and code are required to enable 2FA' },
          { status: 400 }
        );
      }

      // Verify the TOTP code
      const isValid = authenticator.check(code, secret);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid 2FA code. Please try again.' },
          { status: 400 }
        );
      }

      // Save the secret to the user's database record
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
        },
      });

      return NextResponse.json({
        success: true,
        message: '2FA enabled successfully',
      });
    } else {
      // Disable 2FA
      if (!code) {
        return NextResponse.json(
          { error: '2FA code is required to disable 2FA' },
          { status: 400 }
        );
      }

      if (!user?.totpSecret) {
        return NextResponse.json(
          { error: '2FA is not enabled for this account' },
          { status: 400 }
        );
      }

      // Verify the TOTP code before disabling
      const isValid = authenticator.check(code, user.totpSecret);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid 2FA code' },
          { status: 400 }
        );
      }

      // Clear the TOTP secret from the user's database record
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: '2FA disabled successfully',
      });
    }
  } catch (error) {
    console.error('2FA action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform 2FA action' },
      { status: 500 }
    );
  }
}

