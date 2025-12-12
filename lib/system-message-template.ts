import { prisma } from '@/lib/prisma';
import { readTextFileIfExists } from '@/lib/fsutils';
import path from 'path';

/**
 * Get the published system message template
 * Falls back to file if no published template exists in database
 */
export async function getPublishedSystemMessageTemplate(): Promise<string> {
  // Always use file template for now to ensure section markers are present
  // TODO: When database templates are updated with markers, we can use them
  const templatePath = path.join(process.cwd(), 'data/templates/n8n_System_Message.md');
  const fileContent = await readTextFileIfExists(templatePath);
  
  if (!fileContent) {
    throw new Error(`System message template not found at: ${templatePath}`);
  }

  // Verify file template has section markers
  const hasMarkers = /\[(PROTECTED|EDITABLE)_START:/.test(fileContent);
  if (!hasMarkers) {
    throw new Error(`Template file does not contain section markers. Please check: ${templatePath}`);
  }

  console.log('📄 Using template from file:', templatePath);
  return fileContent;
  
  /* 
  // Future: Use database template if it has markers
  try {
    const publishedVersion = await prisma.systemMessageVersion.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      include: { template: true }
    });

    if (publishedVersion) {
      const hasMarkers = /\[(PROTECTED|EDITABLE)_START:/.test(publishedVersion.content);
      if (hasMarkers) {
        console.log('📄 Using published template from database');
        return publishedVersion.content;
      }
    }
  } catch (error) {
    console.warn('Could not check database template, using file:', error);
  }
  */
}
