/**
 * Document Processing Service
 * Handles async text extraction, chunking, and embedding generation
 */

import { prisma } from '@/lib/prisma';
import { extractTextFromFile, estimateTokenCount, detectLanguage } from './text-extraction';
import { chunkTextSmart } from './chunking';
import { FileType } from './types';
import OpenAI from 'openai';
import { logApiCall } from '@/lib/api-call-tracking';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process a document: extract text, chunk, and generate embeddings
 */
export async function processDocument(documentId: string): Promise<void> {
  try {
    console.log(`[Processor] Starting processing for document ${documentId}`);
    
    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { knowledgeBase: true },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured. Please add it to your .env file.');
    }

    // Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // Step 1: Extract text from file
    console.log(`[Processor] Extracting text from ${document.fileType} file`);
    const { text, pageCount, wordCount, language } = await extractTextFromFile(
      document.filePath,
      document.fileType as FileType
    );

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    // Step 2: Chunk the text
    console.log(`[Processor] Chunking text (${wordCount} words)`);
    const chunks = chunkTextSmart(
      text,
      document.chunkSize || 1000,
      document.chunkOverlap || 200
    );

    if (chunks.length === 0) {
      throw new Error('No chunks generated from text');
    }

    console.log(`[Processor] Generated ${chunks.length} chunks`);

    // Step 3: Generate embeddings for each chunk
    console.log(`[Processor] Generating embeddings...`);
    const embeddingModel = 'text-embedding-3-small';
    
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const startTime = Date.now();
        
        // Generate embedding using OpenAI
        const embeddingResponse = await openai.embeddings.create({
          model: embeddingModel,
          input: chunk.content,
          encoding_format: 'float',
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const embedding = embeddingResponse.data[0].embedding;
        totalTokens += chunk.tokenCount;

        // Log the API call for usage tracking
        await logApiCall({
          userId: document.knowledgeBase.userId,
          provider: 'openai',
          model: embeddingModel,
          endpoint: 'embeddings',
          inputTokens: chunk.tokenCount,
          outputTokens: 0, // Embeddings don't have output tokens
          totalTokens: chunk.tokenCount,
          cost: 0.0, // We'll calculate this if needed
          responseTime,
          context: 'knowledge_base_processing',
          documentId: document.id,
          knowledgeBaseId: document.knowledgeBaseId,
        });

        // Store chunk in database
        await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            chunkIndex: chunk.index,
            tokenCount: chunk.tokenCount,
            pageNumber: chunk.metadata?.pageNumber,
            section: chunk.metadata?.section,
            embedding: embedding, // Store as JSON for now (pgvector in next phase)
            embeddingModel,
          },
        });

        console.log(`[Processor] Processed chunk ${i + 1}/${chunks.length}`);
      } catch (error) {
        console.error(`[Processor] Error processing chunk ${i}:`, error);
        
        // Log the failed API call
        await logApiCall({
          userId: document.knowledgeBase.userId,
          provider: 'openai',
          model: embeddingModel,
          endpoint: 'embeddings',
          inputTokens: chunk.tokenCount,
          outputTokens: 0,
          totalTokens: chunk.tokenCount,
          cost: 0.0,
          responseTime: 0,
          context: 'knowledge_base_processing',
          documentId: document.id,
          knowledgeBaseId: document.knowledgeBaseId,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        
        // Continue with other chunks even if one fails
      }
    }

    // Step 4: Update document with extracted data
    await prisma.document.update({
      where: { id: document.id },
      data: {
        extractedText: text,
        pageCount: pageCount || null,
        wordCount,
        language: language || detectLanguage(text),
        status: 'COMPLETED',
        processingError: null,
      },
    });

    // Step 5: Update knowledge base stats
    await prisma.knowledgeBase.update({
      where: { id: document.knowledgeBaseId },
      data: {
        totalChunks: {
          increment: chunks.length,
        },
        totalTokens: {
          increment: totalTokens,
        },
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`[Processor] Document ${documentId} processed successfully`);
    console.log(`[Processor] Stats: ${chunks.length} chunks, ${totalTokens} tokens`);

  } catch (error) {
    console.error(`[Processor] Error processing document ${documentId}:`, error);
    
    // Update document with error status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown processing error',
      },
    });

    throw error;
  }
}

/**
 * Process document asynchronously (non-blocking)
 */
export function processDocumentAsync(documentId: string): void {
  // Process in the background without blocking the request
  processDocument(documentId)
    .then(() => {
      console.log(`[Processor] Background processing completed for ${documentId}`);
    })
    .catch((error) => {
      console.error(`[Processor] Background processing failed for ${documentId}:`, error);
    });
}

/**
 * Reprocess a document (useful for changing chunk settings)
 */
export async function reprocessDocument(documentId: string): Promise<void> {
  console.log(`[Processor] Reprocessing document ${documentId}`);
  
  // Delete existing chunks
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  });

  // Reset document status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'PENDING',
      extractedText: null,
      processingError: null,
    },
  });

  // Reprocess
  await processDocument(documentId);
}

