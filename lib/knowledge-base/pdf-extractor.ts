/**
 * PDF Text Extractor
 * Server-side only - uses unpdf (modern ESM-compatible library)
 */

import { promises as fs } from 'fs';
import { extractText, getDocumentProxy } from 'unpdf';

export async function extractPDFText(filePath: string): Promise<{
  text: string;
  pageCount: number;
  wordCount: number;
}> {
  try {
    console.log('[PDF] Reading PDF file:', filePath);
    const dataBuffer = await fs.readFile(filePath);
    
    console.log('[PDF] Parsing PDF with unpdf, size:', dataBuffer.length, 'bytes');
    
    // Convert Buffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(dataBuffer);
    
    // Extract text using unpdf
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });
    
    console.log('[PDF] Extraction complete, pages:', totalPages);
    const cleanText = text.trim();
    const wordCount = cleanText.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    console.log('[PDF] Extracted', wordCount, 'words');
    
    return {
      text: cleanText,
      pageCount: totalPages,
      wordCount,
    };
  } catch (error) {
    console.error('[PDF] Extraction error details:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

