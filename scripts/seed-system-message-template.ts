import { PrismaClient } from './lib/generated/prisma';
import { readTextFileIfExists } from './lib/fsutils';
import path from 'path';

const prisma = new PrismaClient();

async function seedSystemMessageTemplate() {
  console.log('🌱 Seeding system message template...');

  try {
    // Check if template already exists
    const existingTemplate = await prisma.systemMessageTemplate.findFirst({
      where: { isActive: true },
      include: {
        versions: {
          where: { isPublished: true }
        }
      }
    });

    if (existingTemplate) {
      console.log(`✅ Template already exists (ID: ${existingTemplate.id})`);
      console.log(`   Name: ${existingTemplate.name}`);
      console.log(`   Published versions: ${existingTemplate.versions.length}`);
      return;
    }

    // Read template file - check multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), 'data/templates/n8n_System_Message.md'),
      path.join(process.cwd(), 'public/system_messages/n8n_System_Message.md'),
      path.join(process.cwd(), 'public', 'system_messages', 'n8n_System_Message.md'),
    ];
    
    let fileContent: string | null = null;
    let templatePath = '';
    
    for (const possiblePath of possiblePaths) {
      console.log(`📄 Trying template file: ${possiblePath}`);
      const content = await readTextFileIfExists(possiblePath);
      if (content) {
        fileContent = content;
        templatePath = possiblePath;
        break;
      }
    }
    
    if (!fileContent) {
      throw new Error(`Template file not found. Checked: ${possiblePaths.join(', ')}`);
    }
    
    console.log(`✅ Found template file at: ${templatePath}`);

    console.log(`✅ Template file read (${fileContent.length} characters)`);

    // Create template with initial version
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
            publishedBy: 'system',
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

    console.log(`✅ Created template (ID: ${newTemplate.id})`);
    console.log(`   Name: ${newTemplate.name}`);
    console.log(`   Version 1 created and published`);
    console.log(`   Total versions: ${newTemplate.versions.length}`);
    console.log('🎉 System message template seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding system message template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedSystemMessageTemplate()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seedSystemMessageTemplate;

