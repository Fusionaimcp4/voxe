import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeTextFile } from '@/lib/fsutils';
import { logger } from '@/lib/logger';
import path from 'path';

// POST /api/admin/system-messages/publish - Publish new version
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, changeLog } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get current template
    const template = await prisma.systemMessageTemplate.findFirst({
      where: { isActive: true },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get next version number
    const nextVersion = template.versions.length > 0 ? template.versions[0].version + 1 : 1;

    // Unpublish current version
    await prisma.systemMessageVersion.updateMany({
      where: { 
        templateId: template.id,
        isPublished: true 
      },
      data: { isPublished: false }
    });

    // Create new published version
    const newVersion = await prisma.systemMessageVersion.create({
      data: {
        templateId: template.id,
        version: nextVersion,
        content,
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: session.user.email || 'system',
        changeLog: changeLog || `Published version ${nextVersion}`
      }
    });

    // Update template content
    const updatedTemplate = await prisma.systemMessageTemplate.update({
      where: { id: template.id },
      data: {
        content,
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
    await writeTextFile(templatePath, content);

    logger.info(`Admin ${session.user.email} published system message version`, {
      templateId: template.id,
      version: nextVersion,
      changeLog: changeLog || `Published version ${nextVersion}`
    });

    return NextResponse.json({ 
      template: updatedTemplate,
      version: newVersion
    });

  } catch (error) {
    logger.error('Failed to publish system message version', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to publish system message version',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
