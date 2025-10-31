import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readTextFileIfExists, writeTextFile } from '@/lib/fsutils';
import { logger } from '@/lib/logger';
import path from 'path';

// GET /api/admin/system-messages - Get system message template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the template from database
    const template = await prisma.systemMessageTemplate.findFirst({
      where: { isActive: true },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    // If no template in database, create from file
    if (!template) {
      const templatePath = path.join(process.cwd(), 'data/templates/n8n_System_Message.md');
      const fileContent = await readTextFileIfExists(templatePath);
      
      if (!fileContent) {
        return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
      }

      // Create initial template in database
      const newTemplate = await prisma.systemMessageTemplate.create({
        data: {
          name: 'Master System Message Template',
          description: 'The master template used for all demo creations',
          content: fileContent,
          isActive: true,
          versions: {
            create: {
              version: 1,
              content: fileContent,
              isPublished: true,
              publishedAt: new Date(),
              publishedBy: session.user.email || 'system',
              changeLog: 'Initial template from file'
            }
          }
        },
        include: {
          versions: {
            orderBy: { version: 'desc' }
          }
        }
      });

      logger.info(`Admin ${session.user.email} accessed system message template`, {
        templateId: newTemplate.id,
        action: 'initial_load'
      });

      return NextResponse.json({ template: newTemplate });
    }

    logger.info(`Admin ${session.user.email} accessed system message template`, {
      templateId: template.id,
      action: 'view'
    });

    return NextResponse.json({ template });

  } catch (error) {
    logger.error('Failed to fetch system message template', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to fetch system message template',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT /api/admin/system-messages - Update system message template (save draft)
export async function PUT(request: NextRequest) {
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
      where: { isActive: true }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

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

    logger.info(`Admin ${session.user.email} saved system message draft`, {
      templateId: template.id,
      changeLog: changeLog || 'Draft saved'
    });

    return NextResponse.json({ template: updatedTemplate });

  } catch (error) {
    logger.error('Failed to update system message template', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to update system message template',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
