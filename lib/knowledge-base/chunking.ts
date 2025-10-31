/**
 * Text Chunking Utilities for RAG
 */

import { CHUNKING_CONFIG } from './types';
import { estimateTokenCount } from './text-extraction';

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
  metadata?: {
    pageNumber?: number;
    section?: string;
  };
}

/**
 * Split text into chunks using recursive character splitting
 * This is the recommended approach for general text
 */
export function chunkTextRecursive(
  text: string,
  chunkSize: number = CHUNKING_CONFIG.DEFAULT_CHUNK_SIZE,
  overlap: number = CHUNKING_CONFIG.DEFAULT_OVERLAP
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Validate parameters
  if (chunkSize < CHUNKING_CONFIG.MIN_CHUNK_SIZE) {
    chunkSize = CHUNKING_CONFIG.MIN_CHUNK_SIZE;
  }
  if (chunkSize > CHUNKING_CONFIG.MAX_CHUNK_SIZE) {
    chunkSize = CHUNKING_CONFIG.MAX_CHUNK_SIZE;
  }
  if (overlap >= chunkSize) {
    overlap = Math.floor(chunkSize / 4); // Max 25% overlap
  }

  const chunks: TextChunk[] = [];
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];
  
  const splitText = recursiveSplit(text, chunkSize, overlap, separators);
  
  splitText.forEach((chunk, index) => {
    if (chunk.trim().length > 0) {
      chunks.push({
        content: chunk.trim(),
        index,
        tokenCount: estimateTokenCount(chunk),
      });
    }
  });

  return chunks;
}

/**
 * Recursive text splitting algorithm
 */
function recursiveSplit(
  text: string,
  chunkSize: number,
  overlap: number,
  separators: string[]
): string[] {
  const chunks: string[] = [];
  
  // If text is small enough, return as-is
  if (estimateTokenCount(text) <= chunkSize) {
    return [text];
  }

  // Try each separator
  for (const separator of separators) {
    if (text.includes(separator)) {
      const splits = text.split(separator);
      let currentChunk = '';
      
      for (const split of splits) {
        const testChunk = currentChunk + (currentChunk ? separator : '') + split;
        
        if (estimateTokenCount(testChunk) <= chunkSize) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
            // Add overlap from previous chunk
            const overlapText = getOverlapText(currentChunk, overlap);
            currentChunk = overlapText + (overlapText && split ? separator : '') + split;
          } else {
            // Single split is too large, recurse with smaller separator
            const nextSeparatorIndex = separators.indexOf(separator) + 1;
            if (nextSeparatorIndex < separators.length) {
              const subChunks = recursiveSplit(split, chunkSize, overlap, separators.slice(nextSeparatorIndex));
              chunks.push(...subChunks);
            } else {
              // No more separators, force split
              chunks.push(...forceSplit(split, chunkSize, overlap));
            }
            currentChunk = '';
          }
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      return chunks;
    }
  }

  // No separators found, force split
  return forceSplit(text, chunkSize, overlap);
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.split(' ');
  const overlapWords = Math.ceil(overlapTokens / 0.75); // Approximate words from tokens
  
  if (words.length <= overlapWords) {
    return text;
  }
  
  return words.slice(-overlapWords).join(' ');
}

/**
 * Force split text when no suitable separators found
 */
function forceSplit(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const approxChars = chunkSize * 4; // Rough character estimate
  const overlapChars = overlap * 4;
  
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + approxChars, text.length);
    chunks.push(text.substring(start, end));
    start = end - overlapChars;
  }
  
  return chunks;
}

/**
 * Chunk text by sections (useful for markdown/structured documents)
 */
export function chunkTextBySections(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  // Split by markdown headers or major sections
  const sections = text.split(/^#{1,3}\s+/m);
  
  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (trimmed.length > 0) {
      // Extract section title (first line)
      const lines = trimmed.split('\n');
      const sectionTitle = lines[0];
      
      chunks.push({
        content: trimmed,
        index,
        tokenCount: estimateTokenCount(trimmed),
        metadata: {
          section: sectionTitle,
        },
      });
    }
  });

  return chunks;
}

/**
 * Chunk text by paragraphs (useful for cleaner content)
 */
export function chunkTextByParagraphs(
  text: string,
  maxTokensPerChunk: number = CHUNKING_CONFIG.DEFAULT_CHUNK_SIZE
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    
    const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + trimmed;
    
    if (estimateTokenCount(testChunk) <= maxTokensPerChunk) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunkIndex++,
          tokenCount: estimateTokenCount(currentChunk),
        });
      }
      currentChunk = trimmed;
    }
  }
  
  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      index: chunkIndex,
      tokenCount: estimateTokenCount(currentChunk),
    });
  }

  return chunks;
}

/**
 * Smart chunking that chooses the best strategy
 */
export function chunkTextSmart(text: string, chunkSize?: number, overlap?: number): TextChunk[] {
  // Detect document structure
  const hasHeaders = /^#{1,6}\s+/m.test(text);
  const hasParagraphs = text.includes('\n\n');
  
  if (hasHeaders) {
    // Markdown-style document, chunk by sections
    const sectionChunks = chunkTextBySections(text);
    
    // If sections are too large, further split them
    const finalChunks: TextChunk[] = [];
    sectionChunks.forEach((chunk) => {
      if (chunk.tokenCount > (chunkSize || CHUNKING_CONFIG.DEFAULT_CHUNK_SIZE)) {
        const subChunks = chunkTextRecursive(chunk.content, chunkSize, overlap);
        subChunks.forEach((subChunk) => {
          finalChunks.push({
            ...subChunk,
            metadata: chunk.metadata,
          });
        });
      } else {
        finalChunks.push(chunk);
      }
    });
    
    return finalChunks;
  } else if (hasParagraphs) {
    // Well-formatted document, chunk by paragraphs
    return chunkTextByParagraphs(text, chunkSize);
  } else {
    // Plain text, use recursive splitting
    return chunkTextRecursive(text, chunkSize, overlap);
  }
}

