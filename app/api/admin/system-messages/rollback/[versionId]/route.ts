import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeTextFile } from '@/lib/fsutils';
import { logger } from '@/lib/logger';
import path from 'path';

// POST /api/admin/system-messages/rollback/[versionId] - Rollback to specific version
export async function POST(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the version to rollback to
    const version = await prisma.systemMessageVersion.findUnique({
      where: { id: params.versionId },
      include: {
        template: true
      }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Unpublish current version
    await prisma.systemMessageVersion.updateMany({
      where: { 
        templateId: version.templateId,
        isPublished: true 
      },
      data: { isPublished: false }
    });

    // Publish the rolled back version
    const rolledBackVersion = await prisma.systemMessageVersion.update({
      where: { id: params.versionId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: session.user.email || 'system',
        changeLog: `Rolled back to version ${version.version} by ${session.user.email}`
      }
    });

    // Update template content
    const updatedTemplate = await prisma.systemMessageTemplate.update({
      where: { id: version.templateId },
      data: {
        content: version.content,
        updatedAt: new Date()
      },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    // Update the template file
    const templatePath = path.join(process.cwd(), 'data/templates/n8n_System_Message.md');
    await writeTextFile(templatePath, version.content);

    logger.info(`Admin ${session.user.email} rolled back system message`, {
      templateId: version.templateId,
      fromVersion: version.version,
      action: 'rollback'
    });

    return NextResponse.json({ 
      template: updatedTemplate,
      version: rolledBackVersion
    });

  } catch (error) {
    logger.error('Failed to rollback system message version', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to rollback system message version',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
