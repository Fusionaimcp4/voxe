import { NextRequest, NextResponse } from 'next/server';
import { handleExpiredFreeTrialUsers, handleExpiringFreeTrials } from '@/lib/stripe-db';
import { logger } from '@/lib/logger';

/**
 * Cron job endpoint for handling free trial expiration
 * 
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, cron-job.org)
 * 
 * Security: Protected by CRON_SECRET environment variable to prevent unauthorized access
 * 
 * Usage:
 * - Vercel: Add to vercel.json with schedule
 * - External: Call this endpoint daily with ?secret=YOUR_CRON_SECRET
 * 
 * Endpoints:
 * - GET /api/cron/trial-expiration - Process expired trials and send reminders
 * - GET /api/cron/trial-expiration?action=expire - Only process expired trials
 * - GET /api/cron/trial-expiration?action=remind - Only send expiring trial reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      logger.error('CRON_SECRET not configured. Please set CRON_SECRET environment variable.');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    // Check for secret in query parameter (for external cron services)
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== cronSecret) {
      logger.warn('Unauthorized cron job attempt', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check action parameter to determine what to run
    const action = request.nextUrl.searchParams.get('action');

    logger.info('Cron job started: trial expiration', { action });

    if (action === 'remind') {
      // Only send expiring trial reminders
      await handleExpiringFreeTrials();
      return NextResponse.json({
        success: true,
        action: 'remind',
        message: 'Trial expiration reminders processed',
      });
    } else if (action === 'expire') {
      // Only process expired trials
      await handleExpiredFreeTrialUsers();
      return NextResponse.json({
        success: true,
        action: 'expire',
        message: 'Expired trials processed',
      });
    } else {
      // Default: run both reminders and expiration processing
      await handleExpiringFreeTrials();
      await handleExpiredFreeTrialUsers();
      return NextResponse.json({
        success: true,
        action: 'all',
        message: 'Trial expiration reminders and expired trials processed',
      });
    }
  } catch (error) {
    logger.error('Cron job failed: trial expiration', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering (admin only)
 * Requires authentication via NextAuth session
 */
export async function POST(request: NextRequest) {
  try {
    // For manual triggers, require authentication
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'all';

    logger.info('Manual cron trigger: trial expiration', {
      user: session.user.email,
      action,
    });

    if (action === 'remind') {
      await handleExpiringFreeTrials();
      return NextResponse.json({
        success: true,
        action: 'remind',
        message: 'Trial expiration reminders processed',
      });
    } else if (action === 'expire') {
      await handleExpiredFreeTrialUsers();
      return NextResponse.json({
        success: true,
        action: 'expire',
        message: 'Expired trials processed',
      });
    } else {
      await handleExpiringFreeTrials();
      await handleExpiredFreeTrialUsers();
      return NextResponse.json({
        success: true,
        action: 'all',
        message: 'Trial expiration reminders and expired trials processed',
      });
    }
  } catch (error) {
    logger.error('Manual cron trigger failed: trial expiration', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

