# Remote Chatwoot Server Diagnostic
# This script helps diagnose issues with your remote Chatwoot server

param(
    [string]$ChatwootUrl = "https://chatwoot.mcp4.ai",
    [string]$WebsiteToken = "4zDnxdxE8h69RfvVXtZ4zF2E"
)

Write-Host "Remote Chatwoot Server Diagnostic" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Test 1: Check server health
Write-Host "1. Testing Chatwoot server health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ChatwootUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Server accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    $responseTime = if ($response.Headers.ContainsKey('X-Response-Time')) { $response.Headers['X-Response-Time'] } else { 'N/A' }
    Write-Host "   📊 Response time: $responseTime" -ForegroundColor White
} catch {
    Write-Host "   ❌ Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check SDK endpoint
Write-Host "2. Testing SDK endpoint..." -ForegroundColor Yellow
try {
    $sdkUrl = "$ChatwootUrl/packs/js/sdk.js"
    $sdkResponse = Invoke-WebRequest -Uri $sdkUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ SDK accessible (Status: $($sdkResponse.StatusCode))" -ForegroundColor Green
    Write-Host "   📊 SDK size: $($sdkResponse.Content.Length) bytes" -ForegroundColor White
    
    # Check if SDK content looks valid
    if ($sdkResponse.Content -match "chatwootSDK") {
        Write-Host "   ✅ SDK content appears valid" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  SDK content may be invalid" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ SDK not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check website token validation
Write-Host "3. Testing website token..." -ForegroundColor Yellow
try {
    $tokenUrl = "$ChatwootUrl/api/v1/widget/website_token/$WebsiteToken"
    $tokenResponse = Invoke-WebRequest -Uri $tokenUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Token endpoint accessible (Status: $($tokenResponse.StatusCode))" -ForegroundColor Green
    
    # Try to parse the response
    try {
        $tokenData = $tokenResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Token response is valid JSON" -ForegroundColor Green
        Write-Host "   📊 Token data: $($tokenData | ConvertTo-Json -Compress)" -ForegroundColor White
    } catch {
        Write-Host "   ⚠️  Token response is not valid JSON" -ForegroundColor Yellow
        $preview = if ($tokenResponse.Content.Length -gt 100) { $tokenResponse.Content.Substring(0, 100) } else { $tokenResponse.Content }
        Write-Host "   📊 Raw response: $preview" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Token endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check widget config
Write-Host "4. Testing widget configuration..." -ForegroundColor Yellow
try {
    $configUrl = "$ChatwootUrl/api/v1/widget/config"
    $configResponse = Invoke-WebRequest -Uri $configUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Widget config accessible (Status: $($configResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Widget config failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check CORS headers
Write-Host "5. Testing CORS configuration..." -ForegroundColor Yellow
try {
    $corsUrl = "$ChatwootUrl/packs/js/sdk.js"
    $corsResponse = Invoke-WebRequest -Uri $corsUrl -UseBasicParsing -TimeoutSec 10
    
    $corsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods", 
        "Access-Control-Allow-Headers"
    )
    
    $corsFound = $false
    foreach ($header in $corsHeaders) {
        if ($corsResponse.Headers.ContainsKey($header)) {
            Write-Host "   ✅ $header : $($corsResponse.Headers[$header])" -ForegroundColor Green
            $corsFound = $true
        }
    }
    
    if (-not $corsFound) {
        Write-Host "   ⚠️  No CORS headers found - this may cause issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Check server response headers
Write-Host "6. Checking server headers..." -ForegroundColor Yellow
try {
    $headerResponse = Invoke-WebRequest -Uri $ChatwootUrl -UseBasicParsing -TimeoutSec 10
    
    $importantHeaders = @(
        "Server",
        "X-Powered-By", 
        "X-Frame-Options",
        "Content-Security-Policy"
    )
    
    foreach ($header in $importantHeaders) {
        if ($headerResponse.Headers.ContainsKey($header)) {
            Write-Host "   📊 $header : $($headerResponse.Headers[$header])" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ❌ Header check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Remote Server Troubleshooting:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Check Chatwoot Admin Panel:" -ForegroundColor Yellow
Write-Host "   Go to: $ChatwootUrl/app" -ForegroundColor White
Write-Host "   Login and check:" -ForegroundColor White
Write-Host "   - Account settings" -ForegroundColor White
Write-Host "   - Website widget configuration" -ForegroundColor White
Write-Host "   - Inbox status" -ForegroundColor White
Write-Host ""

Write-Host "2. Check Website Token:" -ForegroundColor Yellow
Write-Host "   - Verify token is active: $WebsiteToken" -ForegroundColor White
Write-Host "   - Check if inbox is enabled" -ForegroundColor White
Write-Host "   - Verify allowed domains include localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "3. Check Server Logs:" -ForegroundColor Yellow
Write-Host "   - Access your Chatwoot server" -ForegroundColor White
Write-Host "   - Check application logs" -ForegroundColor White
Write-Host "   - Look for errors related to widget requests" -ForegroundColor White
Write-Host ""

Write-Host "4. Check Database:" -ForegroundColor Yellow
Write-Host "   - Verify database connectivity" -ForegroundColor White
Write-Host "   - Check if website tokens table is accessible" -ForegroundColor White
Write-Host "   - Look for database connection errors" -ForegroundColor White
Write-Host ""

Write-Host "5. Check Redis/Cache:" -ForegroundColor Yellow
Write-Host "   - Verify Redis is running" -ForegroundColor White
Write-Host "   - Check cache connectivity" -ForegroundColor White
Write-Host "   - Look for cache-related errors" -ForegroundColor White
Write-Host ""

Write-Host "Common Remote Server Issues:" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Server Overload:" -ForegroundColor Yellow
Write-Host "   - High CPU/memory usage" -ForegroundColor White
Write-Host "   - Database connection pool exhausted" -ForegroundColor White
Write-Host "   - Redis memory full" -ForegroundColor White
Write-Host ""

Write-Host "2. Configuration Issues:" -ForegroundColor Yellow
Write-Host "   - CORS not configured for localhost" -ForegroundColor White
Write-Host "   - Website token expired or invalid" -ForegroundColor White
Write-Host "   - Inbox disabled or misconfigured" -ForegroundColor White
Write-Host ""

Write-Host "3. Network Issues:" -ForegroundColor Yellow
Write-Host "   - Firewall blocking requests" -ForegroundColor White
Write-Host "   - Load balancer issues" -ForegroundColor White
Write-Host "   - SSL certificate problems" -ForegroundColor White
Write-Host ""

Write-Host "4. Application Errors:" -ForegroundColor Yellow
Write-Host "   - Ruby/Rails application errors" -ForegroundColor White
Write-Host "   - Database query failures" -ForegroundColor White
Write-Host "   - Redis connection issues" -ForegroundColor White
Write-Host ""

Write-Host "Quick Fixes:" -ForegroundColor Green
Write-Host "===========" -ForegroundColor Green
Write-Host ""

Write-Host "1. Restart Chatwoot services:" -ForegroundColor Yellow
Write-Host "   docker-compose restart" -ForegroundColor White
Write-Host ""

Write-Host "2. Check server resources:" -ForegroundColor Yellow
Write-Host "   docker stats" -ForegroundColor White
Write-Host ""

Write-Host "3. Check logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f chatwoot" -ForegroundColor White
Write-Host ""

Write-Host "4. Verify environment variables:" -ForegroundColor Yellow
Write-Host "   docker-compose config" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Access your Chatwoot server and check logs" -ForegroundColor White
Write-Host "2. Verify website token configuration" -ForegroundColor White
Write-Host "3. Check server resource usage" -ForegroundColor White
Write-Host "4. Test with a simple HTML page" -ForegroundColor White
