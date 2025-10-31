/**
 * Knowledge Base Management Types
 */

export type KBType = 'USER' | 'WORKFLOW' | 'DEMO';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FileType = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'json';

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  type: KBType;
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  lastSyncedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  filename: string;
  originalName: string;
  fileType: FileType;
  fileSize: number;
  filePath: string;
  fileUrl?: string | null;
  extractedText?: string | null;
  summary?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  language?: string | null;
  status: ProcessingStatus;
  processingError?: string | null;
  chunkingStrategy?: string | null;
  chunkSize?: number | null;
  chunkOverlap?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  pageNumber?: number | null;
  section?: string | null;
  embedding?: any;
  embeddingModel: string;
  createdAt: Date;
}

// API Request/Response Types
export interface CreateKBRequest {
  name: string;
  description?: string;
  type?: KBType;
}

export interface UpdateKBRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UploadDocumentRequest {
  knowledgeBaseId: string;
  file: File;
}

export interface ProcessDocumentRequest {
  documentId: string;
  chunkSize?: number;
  chunkOverlap?: number;
  generateEmbeddings?: boolean;
}

export interface SearchKBRequest {
  knowledgeBaseId: string;
  query: string;
  limit?: number;
  similarityThreshold?: number;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
  metadata: {
    pageNumber?: number;
    section?: string;
  };
}

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['pdf', 'docx', 'txt', 'md', 'csv', 'json'],
  MIME_TYPES: {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
  },
} as const;

// Chunking Configuration
export const CHUNKING_CONFIG = {
  DEFAULT_CHUNK_SIZE: 1000,
  DEFAULT_OVERLAP: 200,
  MAX_CHUNK_SIZE: 2000,
  MIN_CHUNK_SIZE: 100,
} as const;

// Processing Status Messages
export const STATUS_MESSAGES = {
  PENDING: 'Waiting to be processed',
  PROCESSING: 'Extracting text and generating embeddings',
  COMPLETED: 'Ready to use',
  FAILED: 'Processing failed',
} as const;

