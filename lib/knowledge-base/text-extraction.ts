/**
 * Text Extraction Utilities for Different File Types
 * Note: This module runs on Node.js runtime only (not edge)
 */

import { promises as fs } from 'fs';
import { FileType } from './types';

/**
 * Extract text from file based on type
 */
export async function extractTextFromFile(
  filePath: string,
  fileType: FileType
): Promise<{
  text: string;
  pageCount?: number;
  wordCount: number;
  language?: string;
}> {
  switch (fileType) {
    case 'txt':
    case 'md':
      return extractTextFromPlainText(filePath);
    
    case 'json':
      return extractTextFromJSON(filePath);
    
    case 'csv':
      return extractTextFromCSV(filePath);
    
    case 'pdf':
      return extractTextFromPDF(filePath);
    
    case 'docx':
      return extractTextFromDOCX(filePath);
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extract text from plain text files (TXT, MD)
 */
async function extractTextFromPlainText(filePath: string): Promise<{
  text: string;
  wordCount: number;
}> {
  const content = await fs.readFile(filePath, 'utf-8');
  const text = content.trim();
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    text,
    wordCount,
  };
}

/**
 * Extract text from JSON files
 */
async function extractTextFromJSON(filePath: string): Promise<{
  text: string;
  wordCount: number;
}> {
  const content = await fs.readFile(filePath, 'utf-8');
  const json = JSON.parse(content);
  
  // Convert JSON to readable text format
  const text = JSON.stringify(json, null, 2);
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    text,
    wordCount,
  };
}

/**
 * Extract text from CSV files
 */
async function extractTextFromCSV(filePath: string): Promise<{
  text: string;
  wordCount: number;
}> {
  try {
    // Use csv-parser for proper CSV parsing
    const csv = require('csv-parser');
    const { createReadStream } = require('fs');
    
    const results: any[] = [];
    const stream = createReadStream(filePath);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Convert CSV data to readable text format
    const text = results.map(row => 
      Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ')
    ).join('\n');
    
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      text,
      wordCount,
    };
  } catch (error) {
    console.error('[CSV] Parsing error, falling back to simple parsing:', error);
    
    // Fallback to simple parsing
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const text = lines.join('\n');
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      text,
      wordCount,
    };
  }
}

/**
 * Extract text from PDF files
 */
async function extractTextFromPDF(filePath: string): Promise<{
  text: string;
  pageCount: number;
  wordCount: number;
}> {
  try {
    // Lazy load PDF extractor to avoid webpack issues
    const { extractPDFText } = await import('./pdf-extractor');
    return await extractPDFText(filePath);
  } catch (error) {
    console.error('[PDF] Extraction error details:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX files
 */
async function extractTextFromDOCX(filePath: string): Promise<{
  text: string;
  wordCount: number;
}> {
  try {
    // Lazy load DOCX extractor to avoid webpack issues
    const { extractDOCXText } = await import('./docx-extractor');
    return await extractDOCXText(filePath);
  } catch (error) {
    console.error('[DOCX] Extraction error details:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Count tokens (approximate - will use tiktoken later)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Detect language (basic detection)
 */
export function detectLanguage(text: string): string {
  // Simple heuristic - check for common English words
  const englishWords = ['the', 'is', 'and', 'to', 'of', 'a', 'in', 'that', 'it', 'with'];
  const words = text.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter(word => englishWords.includes(word)).length;
  
  // If more than 5% are common English words, assume English
  if (englishWordCount / words.length > 0.05) {
    return 'en';
  }
  
  return 'unknown';
}

