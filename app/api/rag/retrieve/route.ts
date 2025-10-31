/**
 * RAG Context Retrieval Endpoint
 * This endpoint is called by n8n workflows to retrieve relevant context from knowledge bases
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cosine similarity function
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// POST - Retrieve relevant context for RAG
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      workflowId, 
      demoId,
      limit = 5, 
      similarityThreshold = 0.7,
      apiKey // Optional: for authentication
    } = body;

    // Validate API key if required
    if (process.env.RAG_API_KEY && apiKey !== process.env.RAG_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Find workflow by workflowId (can be internal ID or n8nWorkflowId) or demoId
    let workflow = null;
    if (workflowId) {
      // Try to find by internal ID first
      workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          demo: true,
          knowledgeBases: {
            where: { 
              isActive: true,
              knowledgeBase: {
                isActive: true
              }
            },
            include: {
              knowledgeBase: true,
            },
            orderBy: { priority: 'asc' },
          },
        },
      });

      // If not found, try to find by n8nWorkflowId
      if (!workflow) {
        workflow = await prisma.workflow.findFirst({
          where: { n8nWorkflowId: workflowId },
          include: {
            demo: true,
            knowledgeBases: {
              where: { 
                isActive: true,
                knowledgeBase: {
                  isActive: true
                }
              },
              include: {
                knowledgeBase: true,
              },
              orderBy: { priority: 'asc' },
            },
          },
        });
      }
    } else if (demoId) {
      workflow = await prisma.workflow.findFirst({
        where: { demoId },
        include: {
          demo: true,
          knowledgeBases: {
            where: { 
              isActive: true,
              knowledgeBase: {
                isActive: true
              }
            },
            include: {
              knowledgeBase: true,
            },
            orderBy: { priority: 'asc' },
          },
        },
      });
    }

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Get knowledge base IDs for this workflow
    const kbIdsToSearch = workflow.knowledgeBases.map(wkb => wkb.knowledgeBaseId);

    if (kbIdsToSearch.length === 0) {
      return NextResponse.json({
        success: true,
        context: '',
        results: [],
        message: 'No knowledge bases assigned to this workflow',
      });
    }

    // Generate embedding for the query
    console.log(`[RAG] Generating embedding for query: "${query.substring(0, 50)}..."`);
    const startTime = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Log the API call for usage tracking
    const { logApiCall } = await import('@/lib/api-call-tracking');
    await logApiCall({
      userId: workflow.userId,
      provider: 'openai',
      model: 'text-embedding-3-small',
      endpoint: 'embeddings',
      inputTokens: Math.ceil(query.length / 4), // Rough estimate
      outputTokens: 0,
      totalTokens: Math.ceil(query.length / 4),
      cost: 0.0,
      responseTime,
      context: 'rag_retrieval',
      workflowId: workflow.id,
    });

    // Get all chunks from the relevant KBs
    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          knowledgeBaseId: { in: kbIdsToSearch },
          status: 'COMPLETED',
        },
      },
      include: {
        document: {
          include: {
            knowledgeBase: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`[RAG] Searching through ${chunks.length} chunks for workflow ${workflow.id}`);

    // Calculate similarity for each chunk
    const results = chunks
      .map(chunk => {
        try {
          const chunkEmbedding = chunk.embedding as number[];
          if (!Array.isArray(chunkEmbedding) || chunkEmbedding.length === 0) {
            return null;
          }

          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

          return {
            content: chunk.content,
            similarity,
            documentName: chunk.document.originalName,
            knowledgeBaseName: chunk.document.knowledgeBase.name,
            chunkIndex: chunk.chunkIndex,
            section: chunk.section,
          };
        } catch (error) {
          console.error(`[RAG] Error calculating similarity for chunk ${chunk.id}:`, error);
          return null;
        }
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .filter(result => result.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Format context for AI
    let context = '';
    if (results.length > 0) {
      context = '### Relevant Knowledge Base Context:\n\n';
      results.forEach((result, index) => {
        context += `[Source ${index + 1}: ${result.documentName}${result.section ? ` - ${result.section}` : ''}]\n`;
        context += `${result.content}\n\n`;
      });
      context += '---\n\n';
    }

    console.log(`[RAG] Found ${results.length} relevant chunks`);

    return NextResponse.json({
      success: true,
      context, // Pre-formatted context string for AI
      results, // Detailed results
      metadata: {
        query,
        workflowId: workflow.id,
        demoId: workflow.demoId,
        totalChunksSearched: chunks.length,
        knowledgeBasesSearched: kbIdsToSearch.length,
        resultsReturned: results.length,
        similarityThreshold,
      },
    });

  } catch (error) {
    console.error('[RAG] Retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

