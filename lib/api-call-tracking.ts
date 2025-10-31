import { prisma } from '@/lib/prisma';

export interface ApiCallData {
  userId: string;
  provider: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  responseTime: number; // milliseconds
  context?: string;
  documentId?: string;
  knowledgeBaseId?: string;
  workflowId?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Log an API call to the database for usage tracking
 */
export async function logApiCall(data: ApiCallData): Promise<void> {
  try {
    await prisma.apiCallLog.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        model: data.model,
        endpoint: data.endpoint,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.totalTokens,
        cost: data.cost,
        responseTime: data.responseTime,
        context: data.context,
        documentId: data.documentId,
        knowledgeBaseId: data.knowledgeBaseId,
        workflowId: data.workflowId,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
    // Don't throw - we don't want API call logging to break the main functionality
  }
}

/**
 * Get API call statistics for a user
 */
export async function getUserApiCallStats(userId: string, startDate?: Date, endDate?: Date) {
  try {
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const [totalCalls, totalTokens, totalCost, recentCalls] = await Promise.all([
      prisma.apiCallLog.count({ where: whereClause }),
      prisma.apiCallLog.aggregate({
        where: whereClause,
        _sum: { totalTokens: true },
      }),
      prisma.apiCallLog.aggregate({
        where: whereClause,
        _sum: { cost: true },
      }),
      prisma.apiCallLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          provider: true,
          model: true,
          endpoint: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          cost: true,
          responseTime: true,
          context: true,
          success: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalCalls,
      totalTokens: totalTokens._sum.totalTokens || 0,
      totalCost: totalCost._sum.cost || 0,
      recentCalls,
    };
  } catch (error) {
    console.error('Failed to get API call stats:', error);
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      recentCalls: [],
    };
  }
}

/**
 * Get API call statistics for knowledge base processing
 */
export async function getKnowledgeBaseApiStats(knowledgeBaseId: string) {
  try {
    const stats = await prisma.apiCallLog.aggregate({
      where: {
        knowledgeBaseId,
        context: 'knowledge_base_processing',
      },
      _count: { id: true },
      _sum: { 
        totalTokens: true,
        cost: true,
      },
    });

    return {
      totalCalls: stats._count.id,
      totalTokens: stats._sum.totalTokens || 0,
      totalCost: stats._sum.cost || 0,
    };
  } catch (error) {
    console.error('Failed to get knowledge base API stats:', error);
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
    };
  }
}

/**
 * Get API call statistics for document processing
 */
export async function getDocumentApiStats(documentId: string) {
  try {
    const stats = await prisma.apiCallLog.aggregate({
      where: {
        documentId,
        context: 'knowledge_base_processing',
      },
      _count: { id: true },
      _sum: { 
        totalTokens: true,
        cost: true,
      },
    });

    return {
      totalCalls: stats._count.id,
      totalTokens: stats._sum.totalTokens || 0,
      totalCost: stats._sum.cost || 0,
    };
  } catch (error) {
    console.error('Failed to get document API stats:', error);
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
    };
  }
}
