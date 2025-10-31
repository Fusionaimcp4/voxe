# Simple Chatwoot Remote Server Test
# This script tests your remote Chatwoot server

Write-Host "Testing Remote Chatwoot Server" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

$chatwootUrl = "https://chatwoot.mcp4.ai"
$websiteToken = "4zDnxdxE8h69RfvVXtZ4zF2E"

# Test 1: Basic server connectivity
Write-Host "1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $chatwootUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Server accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: SDK endpoint
Write-Host "2. Testing SDK endpoint..." -ForegroundColor Yellow
try {
    $sdkUrl = "$chatwootUrl/packs/js/sdk.js"
    $sdkResponse = Invoke-WebRequest -Uri $sdkUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ SDK accessible (Status: $($sdkResponse.StatusCode))" -ForegroundColor Green
    Write-Host "   📊 SDK size: $($sdkResponse.Content.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "   ❌ SDK not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Website token
Write-Host "3. Testing website token..." -ForegroundColor Yellow
try {
    $tokenUrl = "$chatwootUrl/api/v1/widget/website_token/$websiteToken"
    $tokenResponse = Invoke-WebRequest -Uri $tokenUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Token endpoint accessible (Status: $($tokenResponse.StatusCode))" -ForegroundColor Green
    Write-Host "   📊 Response length: $($tokenResponse.Content.Length) characters" -ForegroundColor White
} catch {
    Write-Host "   ❌ Token endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Based on the terminal logs showing JSON parsing errors and 500 errors," -ForegroundColor Cyan
Write-Host "the issue is likely with your remote Chatwoot server configuration." -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Access your Chatwoot server (SSH or console)" -ForegroundColor White
Write-Host "2. Check Docker container status:" -ForegroundColor White
Write-Host "   docker ps" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check Chatwoot logs:" -ForegroundColor White
Write-Host "   docker-compose logs chatwoot" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check database logs:" -ForegroundColor White
Write-Host "   docker-compose logs postgres" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Check Redis logs:" -ForegroundColor White
Write-Host "   docker-compose logs redis" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Restart services:" -ForegroundColor White
Write-Host "   docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Check Chatwoot admin panel:" -ForegroundColor White
Write-Host "   https://chatwoot.mcp4.ai/app" -ForegroundColor Gray
Write-Host "   - Verify website token is active" -ForegroundColor White
Write-Host "   - Check if inbox is enabled" -ForegroundColor White
Write-Host "   - Verify CORS settings allow localhost:3000" -ForegroundColor White
