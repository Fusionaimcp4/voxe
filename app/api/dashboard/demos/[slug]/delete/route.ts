import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateN8nWorkflowStatus } from '@/lib/n8n-api';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { domainName } = await request.json();

    if (!domainName) {
      return NextResponse.json(
        { error: 'Domain name confirmation is required' },
        { status: 400 }
      );
    }

    // Find the demo and verify ownership
    const demo = await prisma.demo.findFirst({
      where: {
        slug,
        userId: session.user.id
      },
      include: {
        workflows: {
          select: {
            id: true,
            n8nWorkflowId: true,
            status: true
          }
        },
        systemMessages: {
          select: {
            id: true
          }
        }
      }
    });

    if (!demo) {
      return NextResponse.json(
        { error: 'Demo not found or access denied' },
        { status: 404 }
      );
    }

    // Verify domain name matches
    if (demo.businessName !== domainName) {
      return NextResponse.json(
        { error: 'Domain name does not match. Deletion cancelled.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Starting deletion process for demo: ${demo.businessName}`);

    // Start transaction for database cleanup
    const result = await prisma.$transaction(async (tx) => {
      // 1. Stop n8n workflows if they exist and are active
      for (const workflow of demo.workflows) {
        if (workflow.n8nWorkflowId && workflow.status === 'ACTIVE') {
          try {
            console.log(`🛑 Stopping n8n workflow: ${workflow.n8nWorkflowId}`);
            await updateN8nWorkflowStatus(workflow.n8nWorkflowId, false);
            console.log(`✅ n8n workflow stopped successfully`);
          } catch (error) {
            console.error(`❌ Failed to stop n8n workflow:`, error);
            // Continue with deletion even if workflow stop fails
          }
        }
      }

      // 2. Delete workflow records
      if (demo.workflows.length > 0) {
        await tx.workflow.deleteMany({
          where: { 
            id: { 
              in: demo.workflows.map(w => w.id) 
            } 
          }
        });
        console.log(`✅ ${demo.workflows.length} workflow record(s) deleted`);
      }

      // 3. Delete system message records
      if (demo.systemMessages.length > 0) {
        await tx.systemMessage.deleteMany({
          where: { 
            id: { 
              in: demo.systemMessages.map(sm => sm.id) 
            } 
          }
        });
        console.log(`✅ ${demo.systemMessages.length} system message record(s) deleted`);
      }

      // 4. Delete demo record
      await tx.demo.delete({
        where: { id: demo.id }
      });
      console.log(`✅ Demo record deleted`);

      return { success: true };
    });

    // 5. Clean up file system (outside transaction)
    try {
      const demoDir = path.join(process.cwd(), 'public', 'demos', slug);
      const systemMessageFile = path.join(process.cwd(), 'public', 'system_messages', `n8n_System_Message_${slug}.md`);
      
      // Delete demo directory
      try {
        await fs.rm(demoDir, { recursive: true, force: true });
        console.log(`✅ Demo directory deleted: ${demoDir}`);
      } catch (error) {
        console.log(`⚠️ Demo directory not found or already deleted: ${demoDir}`);
      }

      // Delete system message file
      try {
        await fs.unlink(systemMessageFile);
        console.log(`✅ System message file deleted: ${systemMessageFile}`);
      } catch (error) {
        console.log(`⚠️ System message file not found or already deleted: ${systemMessageFile}`);
      }
    } catch (error) {
      console.error(`❌ File system cleanup failed:`, error);
      // Continue even if file cleanup fails
    }

    // 6. Clean up Chatwoot resources
    if (demo.chatwootInboxId) {
      try {
        console.log(`🗑️ Cleaning up Chatwoot resources for inbox: ${demo.chatwootInboxId}`);
        
        // Delete the inbox (this will also delete associated bots)
        const chatwootResponse = await fetch(`https://chatwoot.mcp4.ai/api/v1/accounts/2/inboxes/${demo.chatwootInboxId}`, {
          method: 'DELETE',
          headers: {
            'api_access_token': process.env.CHATWOOT_API_KEY || '',
            'Content-Type': 'application/json'
          }
        });

        if (chatwootResponse.ok) {
          console.log(`✅ Chatwoot inbox deleted successfully: ${demo.chatwootInboxId}`);
        } else {
          const errorText = await chatwootResponse.text();
          console.error(`❌ Failed to delete Chatwoot inbox: ${chatwootResponse.status} ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ Chatwoot cleanup failed:`, error);
        // Continue even if Chatwoot cleanup fails
      }
    } else {
      console.log(`ℹ️ No Chatwoot inbox ID found, skipping Chatwoot cleanup`);
    }

    console.log(`🎉 Demo deletion completed successfully: ${demo.businessName}`);

    return NextResponse.json({
      success: true,
      message: `Demo "${demo.businessName}" has been deleted successfully.`,
      deletedDemo: {
        id: demo.id,
        businessName: demo.businessName,
        slug: demo.slug
      }
    });

  } catch (error) {
    console.error('Demo deletion API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete demo' },
      { status: 500 }
    );
  }
}
