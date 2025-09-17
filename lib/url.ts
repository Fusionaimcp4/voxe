/**
 * URL normalization utilities
 */

/**
 * Normalizes a URL input to a canonical https:// format
 * @param input - The user input (e.g., "example.com", "www.example.com", "https://example.com")
 * @returns Normalized URL with https:// prefix
 * @throws Error if the resulting URL is invalid
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  
  if (!trimmed) {
    throw new Error('URL cannot be empty');
  }
  
  // If already has protocol, use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Validate existing URL
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      throw new Error('Invalid URL format');
    }
  }
  
  // Otherwise, prefix with https://
  const normalized = `https://${trimmed}`;
  
  // Validate the resulting URL
  try {
    const url = new URL(normalized);
    
    // Additional validation: ensure it has a valid hostname
    if (!url.hostname || url.hostname.length < 3) {
      throw new Error('Invalid hostname');
    }
    
    // Check for basic domain structure (at least one dot for TLD)
    if (!url.hostname.includes('.')) {
      throw new Error('Invalid domain format');
    }
    
    // Check for invalid characters like double dots
    if (url.hostname.includes('..')) {
      throw new Error('Invalid domain format');
    }
    
    return normalized;
  } catch {
    throw new Error('Invalid URL format');
  }
}
