/**
 * File Upload and Validation Utilities
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UPLOAD_CONFIG, FileType } from './types';

/**
 * Validate file type and size
 */
export function validateFile(file: File | { size: number; type: string; name: string }): {
  isValid: boolean;
  error?: string;
  fileType?: FileType;
} {
  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check file size minimum
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }

  // Determine file type from extension
  const ext = path.extname(file.name).toLowerCase().replace('.', '');
  const fileType = ext as FileType;

  // Check if file type is allowed
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: `File type .${ext} not supported. Allowed types: ${UPLOAD_CONFIG.ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Validate MIME type if available
  if (file.type) {
    const expectedMime = UPLOAD_CONFIG.MIME_TYPES[fileType];
    if (expectedMime && file.type !== expectedMime) {
      // Some browsers send generic MIME types, so we'll warn but not fail
      console.warn(`MIME type mismatch: expected ${expectedMime}, got ${file.type}`);
    }
  }

  return {
    isValid: true,
    fileType,
  };
}

/**
 * Generate unique filename with hash
 */
export function generateUniqueFilename(originalName: string, userId: string): string {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const timestamp = Date.now();
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${originalName}-${timestamp}`)
    .digest('hex')
    .substring(0, 8);
  
  // Sanitize filename
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50);
  
  return `${sanitizedName}-${hash}${ext}`;
}

/**
 * Get storage path for knowledge base documents
 */
export function getStoragePath(userId: string, knowledgeBaseId: string): string {
  return path.join(process.cwd(), 'public', 'knowledge-bases', userId, knowledgeBaseId);
}

/**
 * Ensure storage directory exists
 */
export async function ensureStorageDirectory(storagePath: string): Promise<void> {
  try {
    await fs.mkdir(storagePath, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Save uploaded file to disk
 */
export async function saveFileToDisk(
  fileBuffer: Buffer,
  storagePath: string,
  filename: string
): Promise<string> {
  await ensureStorageDirectory(storagePath);
  const filePath = path.join(storagePath, filename);
  await fs.writeFile(filePath, fileBuffer);
  return filePath;
}

/**
 * Delete file from disk
 */
export async function deleteFileFromDisk(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete file:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  exists: boolean;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      exists: true,
    };
  } catch (error) {
    return {
      size: 0,
      exists: false,
    };
  }
}

/**
 * Convert File to Buffer (for Next.js API routes)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get public URL for file
 */
export function getPublicFileUrl(userId: string, knowledgeBaseId: string, filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/knowledge-bases/${userId}/${knowledgeBaseId}/${filename}`;
}

