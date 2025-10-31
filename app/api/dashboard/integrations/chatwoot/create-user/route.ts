import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createChatwootUser, generatePlusAddressedEmail, getAgentLimitForTier } from '@/lib/chatwoot_helpdesk';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/dashboard/integrations/chatwoot/create-user called');
  
  try {
    if (!prisma) {
      console.error('❌ Database not available');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.log('🔑 Session check:', session?.user?.id ? 'Authenticated' : 'Not authenticated');
    console.log('🔑 Session user ID:', session?.user?.id);
    console.log('🔑 Full session:', JSON.stringify(session?.user, null, 2));
    
    // Debug: Test database connection
    console.log('🔍 Testing database connection...');
    const testUserCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${testUserCount}`);
    
    // Show first user if any
    if (testUserCount > 0) {
      const firstUser = await prisma.user.findFirst({
        select: { id: true, email: true, name: true },
      });
      console.log(`📋 Sample user:`, firstUser);
    }
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, password, userEmail } = await request.json();

    if (!name || !password || !userEmail) {
      return NextResponse.json(
        { error: 'Name, password, and user email are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Generate plus-addressed email (admin@domain.com -> admin+agentname@domain.com)
    const agentEmail = generatePlusAddressedEmail(userEmail, name);
    console.log(`📧 Generated agent email: ${agentEmail}`);

    // Use tier from session (no need to query database)
    const subscriptionTier = session.user.subscriptionTier || 'FREE';
    console.log('✅ Subscription tier from session:', subscriptionTier);

    // Check tier limit
    console.log('🔍 Checking tier limits...');
    const agentLimit = getAgentLimitForTier(subscriptionTier);
    console.log('📊 Agent limit for tier:', agentLimit);
    
    const existingAgents = await prisma.helpdeskUser.count({
      where: { userId: session.user.id },
    });
    console.log('👥 Existing agents count:', existingAgents);

    if (existingAgents >= agentLimit && agentLimit !== -1) {
      return NextResponse.json(
        { error: `You have reached your tier limit of ${agentLimit} agent(s)` },
        { status: 403 }
      );
    }

    console.log(`🔧 About to call createChatwootUser with:`, {
      userId: session.user.id,
      name,
      email: agentEmail,
      role: 'agent'
    });

    // Create user in Chatwoot with plus-addressed email
    const chatwootResult = await createChatwootUser(
      session.user.id,
      name,
      agentEmail,  // Use the generated plus-addressed email
      password,
      'agent'
    );

    console.log(`✅ Chatwoot user creation result:`, {
      success: chatwootResult.success,
      email: agentEmail,
      chatwootUserId: chatwootResult.user?.id,
      error: chatwootResult.error
    });

    if (!chatwootResult.success || !chatwootResult.user) {
      return NextResponse.json(
        { error: chatwootResult.error || 'Failed to create Chatwoot user' },
        { status: 500 }
      );
    }

    // Verify user exists in database - search by email if ID doesn't work
    console.log(`🔍 Checking if user ${session.user.id} exists in database...`);
    let userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });
    
    // If not found by ID, try by email
    if (!userExists && session.user.email) {
      console.log(`🔍 User not found by ID, trying to find by email: ${session.user.email}`);
      userExists = await prisma.user.findFirst({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
    }
    
    if (!userExists) {
      console.error(`❌ User ${session.user.id} not found in database`);
      console.error(`📝 Session user details:`, session.user);
      
      // Let's try to list some users to debug
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true },
        take: 5,
      });
      console.log(`📋 Sample users in database:`, allUsers);
      
      return NextResponse.json(
        { error: 'User not found in database', sessionId: session.user.id, sessionEmail: session.user.email },
        { status: 404 }
      );
    }
    
    console.log(`✅ User found:`, userExists);
    
    // Use the actual database user ID
    const actualUserId = userExists.id;
    console.log(`🔄 Using actual user ID: ${actualUserId}`);
    
    // Save to database
    console.log(`💾 Saving helpdesk user to database...`);
    const helpdeskUser = await prisma.helpdeskUser.create({
      data: {
        userId: actualUserId, // Use the actual database user ID
        name,
        email: agentEmail,
        chatwootUserId: chatwootResult.user.id,
        chatwootRole: 'agent',
      },
      select: {
        id: true,
        name: true,
        email: true,
        chatwootUserId: true,
        chatwootRole: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      agent: helpdeskUser,
    });

  } catch (error) {
    console.error('❌ Failed to create helpdesk user:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create helpdesk user' },
      { status: 500 }
    );
  }
}

