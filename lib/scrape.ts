export async function fetchAndClean(url: string) {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching URL: ${url} (attempt ${attempt}/${maxRetries})`);
      
      // Configure fetch with timeout and robust headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const fetchOptions: RequestInit = {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      };
      
      // Handle SSL certificate issues by setting environment variable
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      if (attempt > 1) {
        console.warn(`🔓 Attempt ${attempt}: Using relaxed SSL validation for ${url}`);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }
      
      const res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Restore SSL setting
      if (originalRejectUnauthorized !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
      } else if (attempt > 1) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const rawHtml = await res.text();
      
      if (!rawHtml || rawHtml.trim().length === 0) {
        throw new Error('Empty response received');
      }
      
      const cleanedText = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (!cleanedText || cleanedText.length < 50) {
        throw new Error('Insufficient content extracted from page');
      }
        
      console.log(`✅ Successfully fetched and cleaned ${url} (${cleanedText.length} characters)`);
      return { rawHtml, cleanedText };
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`💥 All ${maxRetries} attempts failed for ${url}`);
        
        // Provide more helpful error messages
        if (errorMessage.includes('UND_ERR_SOCKET') || errorMessage.includes('other side closed')) {
          throw new Error(`Website ${url} is not accessible (connection refused or closed by server). Please check if the URL is correct and the website is online.`);
        }
        if (errorMessage.includes('certificate') || errorMessage.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
          throw new Error(`SSL certificate error for ${url}. The website may have an invalid or self-signed certificate.`);
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
          throw new Error(`Timeout error for ${url}. The website took too long to respond (>30 seconds).`);
        }
        if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
          throw new Error(`DNS error for ${url}. The website domain could not be found.`);
        }
        
        throw new Error(`Failed to fetch ${url}: ${errorMessage}`);
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error(`Unexpected error: all retry attempts completed without success`);
}
