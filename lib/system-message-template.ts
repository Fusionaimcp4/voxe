import { prisma } from '@/lib/prisma';
import { readTextFileIfExists } from '@/lib/fsutils';
import path from 'path';

/**
 * Get the published system message template
 * Falls back to file if no published template exists in database
 */
export async function getPublishedSystemMessageTemplate(): Promise<string> {
  try {
    // Try to get published template from database
    const publishedVersion = await prisma.systemMessageVersion.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      include: {
        template: true
      }
    });

    if (publishedVersion) {
      return publishedVersion.content;
    }

    // Fallback to file if no published version exists
    const templatePath = path.join(process.cwd(), 'data/templates/n8n_System_Message.md');
    const fileContent = await readTextFileIfExists(templatePath);
    
    if (!fileContent) {
      throw new Error('No system message template found in database or file');
    }

    return fileContent;
  } catch (error) {
    console.error('Failed to get published system message template:', error);
    
    // Final fallback to file
    const templatePath = path.join(process.cwd(), 'data/templates/n8n_System_Message.md');
    const fileContent = await readTextFileIfExists(templatePath);
    
    if (!fileContent) {
      throw new Error('System message template not found');
    }

    return fileContent;
  }
}
