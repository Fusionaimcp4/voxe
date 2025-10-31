import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionTier } from '@/lib/generated/prisma';

export const runtime = 'nodejs';

// GET - Get all pricing plans (public)
export async function GET(request: NextRequest) {
  try {
    const pricingPlans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        tier: true,
        name: true,
        price: true,
        currency: true,
        period: true,
        description: true,
        features: true,
        isPopular: true,
        isActive: true,
        ctaText: true,
        ctaHref: true,
        stripeMonthlyPriceId: true,
        stripeYearlyPriceId: true,
        annualDiscountPercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(pricingPlans.map(plan => ({
      ...plan,
      price: Number(plan.price), // Ensure price is a number
    })));
  } catch (error) {
    console.error('Failed to fetch pricing plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans' },
      { status: 500 }
    );
  }
}

// POST - Create or update pricing plan (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tier, name, price, currency, period, description, features, isPopular, ctaText, ctaHref, stripeMonthlyPriceId, stripeYearlyPriceId, annualDiscountPercentage } = body;

    if (!tier || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Tier, name, and price are required' },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Upsert pricing plan
    const pricingPlan = await prisma.pricingPlan.upsert({
      where: { tier },
      update: {
        name,
        price: parseFloat(price),
        currency: currency || 'USD',
        period: period || 'month',
        description,
        features: features || [],
        isPopular: isPopular || false,
        ctaText: ctaText || 'Get Started',
        ctaHref: ctaHref || '/dashboard/userdemo',
        stripeMonthlyPriceId,
        stripeYearlyPriceId,
        annualDiscountPercentage: annualDiscountPercentage !== undefined ? parseInt(annualDiscountPercentage) : undefined,
        updatedAt: new Date(),
      },
      create: {
        tier,
        name,
        price: parseFloat(price),
        currency: currency || 'USD',
        period: period || 'month',
        description,
        features: features || [],
        isPopular: isPopular || false,
        ctaText: ctaText || 'Get Started',
        ctaHref: ctaHref || '/dashboard/userdemo',
        stripeMonthlyPriceId,
        stripeYearlyPriceId,
        annualDiscountPercentage: annualDiscountPercentage !== undefined ? parseInt(annualDiscountPercentage) : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pricing plan updated for ${tier}`,
      pricingPlan
    });
  } catch (error) {
    console.error('Failed to update pricing plan:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing plan' },
      { status: 500 }
    );
  }
}

// PUT - Update pricing plan (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, price, currency, period, description, features, isPopular, ctaText, ctaHref, stripeMonthlyPriceId, stripeYearlyPriceId, annualDiscountPercentage } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const pricingPlan = await prisma.pricingPlan.update({
      where: { id },
      data: {
        name,
        price: price !== undefined ? parseFloat(price) : undefined,
        currency,
        period,
        description,
        features,
        isPopular,
        ctaText,
        ctaHref,
        stripeMonthlyPriceId,
        stripeYearlyPriceId,
        annualDiscountPercentage: annualDiscountPercentage !== undefined ? parseInt(annualDiscountPercentage) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing plan updated successfully',
      pricingPlan
    });
  } catch (error) {
    console.error('Failed to update pricing plan:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing plan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing plan (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    await prisma.pricingPlan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing plan deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete pricing plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing plan' },
      { status: 500 }
    );
  }
}
