/**
 * DOCX Text Extractor
 * Server-side only - uses dynamic import for ES modules
 */

export async function extractDOCXText(filePath: string): Promise<{
  text: string;
  wordCount: number;
}> {
  try {
    console.log('[DOCX] Reading DOCX file:', filePath);
    
    console.log('[DOCX] Loading mammoth dynamically...');
    // Dynamic import to handle ES modules
    const mammoth = await import('mammoth');
    
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value.trim();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log('[DOCX] Extracted', wordCount, 'words');
    
    return {
      text,
      wordCount,
    };
  } catch (error) {
    console.error('[DOCX] Extraction error details:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

