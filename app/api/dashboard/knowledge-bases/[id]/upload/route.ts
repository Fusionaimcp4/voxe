import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateFile,
  generateUniqueFilename,
  getStoragePath,
  saveFileToDisk,
  fileToBuffer,
  getPublicFileUrl,
} from '@/lib/knowledge-base/file-utils';
import { processDocumentAsync } from '@/lib/knowledge-base/document-processor';
import { canPerformAction, trackUsage } from '@/lib/usage-tracking';

export const runtime = 'nodejs';

// POST - Upload document to knowledge base
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: knowledgeBaseId } = await params;
    const userId = session.user.id;

    // Verify knowledge base exists and belongs to user
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: {
        id: knowledgeBaseId,
        userId,
      },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: 'Knowledge base not found' },
        { status: 404 }
      );
    }

    // Check tier limits before proceeding
    const usageCheck = await canPerformAction(userId, 'upload_document');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Tier limit exceeded',
          message: usageCheck.reason,
          usage: usageCheck.usage,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const fileType = validation.fileType!;

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, userId);
    
    // Get storage path
    const storagePath = getStoragePath(userId, knowledgeBaseId);
    
    // Convert file to buffer and save
    const fileBuffer = await fileToBuffer(file);
    const filePath = await saveFileToDisk(fileBuffer, storagePath, filename);
    
    // Get public URL
    const fileUrl = getPublicFileUrl(userId, knowledgeBaseId, filename);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        knowledgeBaseId,
        filename,
        originalName: file.name,
        fileType,
        fileSize: file.size,
        filePath,
        fileUrl,
        status: 'PENDING', // Will be processed asynchronously
      },
    });

    // Trigger async processing (non-blocking)
    console.log(`Document ${document.id} uploaded, starting background processing`);
    processDocumentAsync(document.id);

    // Update KB stats
    await prisma.knowledgeBase.update({
      where: { id: knowledgeBaseId },
      data: {
        totalDocuments: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    // Track usage
    await trackUsage(userId, 'document_uploaded');

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        createdAt: document.createdAt,
      },
      message: 'File uploaded successfully. Processing will begin shortly.',
    }, { status: 201 });

  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

