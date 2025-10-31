import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFileFromDisk } from '@/lib/knowledge-base/file-utils';
import { reprocessDocument } from '@/lib/knowledge-base/document-processor';

export const runtime = 'nodejs';

// GET - Get document details
export async function GET(
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

    const { id: documentId } = await params;
    const userId = session.user.id;

    // Get document with KB verification
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        knowledgeBase: {
          userId, // Ensure user owns the KB
        },
      },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
          },
        },
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            tokenCount: true,
            content: true,
          },
          orderBy: {
            chunkIndex: 'asc',
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(
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

    const { id: documentId } = await params;
    const userId = session.user.id;

    // Get document with KB verification
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        knowledgeBase: {
          userId,
        },
      },
      include: {
        chunks: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from disk
    try {
      await deleteFileFromDisk(document.filePath);
    } catch (error) {
      console.warn('Failed to delete file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Get stats before deletion
    const chunkCount = document.chunks.length;
    const tokenCount = document.chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);

    // Delete document (cascades to chunks)
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Update KB stats
    await prisma.knowledgeBase.update({
      where: { id: document.knowledgeBaseId },
      data: {
        totalDocuments: {
          decrement: 1,
        },
        totalChunks: {
          decrement: chunkCount,
        },
        totalTokens: {
          decrement: tokenCount,
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Reprocess document
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

    const { id: documentId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { action, chunkSize, chunkOverlap } = body;

    if (action !== 'reprocess') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get document with KB verification
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        knowledgeBase: {
          userId,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update chunk settings if provided
    if (chunkSize || chunkOverlap) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          chunkSize: chunkSize || document.chunkSize,
          chunkOverlap: chunkOverlap || document.chunkOverlap,
        },
      });
    }

    // Trigger reprocessing (async)
    console.log(`Reprocessing document ${documentId}`);
    reprocessDocument(documentId).catch(error => {
      console.error(`Reprocessing failed for ${documentId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: 'Document reprocessing started',
    });

  } catch (error) {
    console.error('Reprocess document error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reprocess document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

