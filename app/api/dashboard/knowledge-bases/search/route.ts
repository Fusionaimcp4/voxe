import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

// POST - Search knowledge base with semantic similarity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { 
      query, 
      knowledgeBaseIds, 
      workflowId,
      limit = 5, 
      similarityThreshold = 0.7 
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Determine which knowledge bases to search
    let kbIdsToSearch: string[] = [];

    if (workflowId) {
      // Search KBs assigned to this workflow
      const workflowKBs = await prisma.workflowKnowledgeBase.findMany({
        where: {
          workflowId,
          isActive: true,
          knowledgeBase: {
            userId, // Ensure user owns the KB
            isActive: true,
          },
        },
        include: {
          knowledgeBase: true,
        },
        orderBy: {
          priority: 'asc',
        },
      });

      kbIdsToSearch = workflowKBs.map(wkb => wkb.knowledgeBaseId);
    } else if (knowledgeBaseIds && Array.isArray(knowledgeBaseIds)) {
      // Search specific KBs (verify user owns them)
      const userKBs = await prisma.knowledgeBase.findMany({
        where: {
          id: { in: knowledgeBaseIds },
          userId,
          isActive: true,
        },
        select: { id: true },
      });

      kbIdsToSearch = userKBs.map(kb => kb.id);
    } else {
      // Search all user's KBs
      const userKBs = await prisma.knowledgeBase.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: { id: true },
      });

      kbIdsToSearch = userKBs.map(kb => kb.id);
    }

    if (kbIdsToSearch.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No knowledge bases found to search',
      });
    }

    // Generate embedding for the query
    console.log(`[Search] Generating embedding for query: "${query.substring(0, 50)}..."`);
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
      userId: session.user.id,
      provider: 'openai',
      model: 'text-embedding-3-small',
      endpoint: 'embeddings',
      inputTokens: Math.ceil(query.length / 4), // Rough estimate
      outputTokens: 0,
      totalTokens: Math.ceil(query.length / 4),
      cost: 0.0,
      responseTime,
      context: 'knowledge_base_search',
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

    console.log(`[Search] Searching through ${chunks.length} chunks`);

    // Calculate similarity for each chunk
    const results = chunks
      .map(chunk => {
        try {
          const chunkEmbedding = chunk.embedding as number[];
          if (!Array.isArray(chunkEmbedding) || chunkEmbedding.length === 0) {
            console.warn(`[Search] Invalid embedding for chunk ${chunk.id}`);
            return null;
          }

          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

          return {
            id: chunk.id,
            content: chunk.content,
            similarity,
            documentId: chunk.documentId,
            documentName: chunk.document.originalName,
            knowledgeBaseId: chunk.document.knowledgeBaseId,
            knowledgeBaseName: chunk.document.knowledgeBase.name,
            chunkIndex: chunk.chunkIndex,
            tokenCount: chunk.tokenCount,
            pageNumber: chunk.pageNumber,
            section: chunk.section,
          };
        } catch (error) {
          console.error(`[Search] Error calculating similarity for chunk ${chunk.id}:`, error);
          return null;
        }
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .filter(result => result.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`[Search] Found ${results.length} relevant chunks`);

    return NextResponse.json({
      success: true,
      results,
      metadata: {
        query,
        totalChunksSearched: chunks.length,
        knowledgeBasesSearched: kbIdsToSearch.length,
        resultsReturned: results.length,
        similarityThreshold,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

