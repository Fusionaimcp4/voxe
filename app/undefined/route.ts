import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all route for /undefined requests
 * These are typically from third-party widgets (like ReferralRocket) 
 * making requests before they're fully initialized.
 * We return a 204 No Content to suppress the 404 errors in logs.
 */
export async function GET(request: NextRequest) {
  // Return 204 No Content - silent success, no response body
  // This prevents 404 errors from cluttering logs while not breaking anything
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}

