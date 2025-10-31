# Chatwoot Docker Diagnostic Script
# This script helps diagnose issues with self-hosted Chatwoot Docker setup

param(
    [string]$ChatwootUrl = "https://chatwoot.mcp4.ai",
    [string]$DockerComposePath = "docker-compose.yml"
)

Write-Host "Chatwoot Docker Diagnostic" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

# Test 1: Check if Chatwoot is accessible
Write-Host "1. Testing Chatwoot server accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ChatwootUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Chatwoot server accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Chatwoot server not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check Chatwoot SDK endpoint
Write-Host "2. Testing Chatwoot SDK endpoint..." -ForegroundColor Yellow
try {
    $sdkUrl = "$ChatwootUrl/packs/js/sdk.js"
    $sdkResponse = Invoke-WebRequest -Uri $sdkUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Chatwoot SDK accessible (Status: $($sdkResponse.StatusCode))" -ForegroundColor Green
    Write-Host "   📊 SDK file size: $($sdkResponse.Content.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "   ❌ Chatwoot SDK not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check Chatwoot API endpoints
Write-Host "3. Testing Chatwoot API endpoints..." -ForegroundColor Yellow
$apiEndpoints = @(
    "/api/v1/accounts",
    "/api/v1/widget/website_token/4zDnxdxE8h69RfvVXtZ4zF2E",
    "/api/v1/widget/config"
)

foreach ($endpoint in $apiEndpoints) {
    try {
        $apiUrl = "$ChatwootUrl$endpoint"
        $apiResponse = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 10
        Write-Host "   ✅ $endpoint (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Check Docker containers (if docker-compose.yml exists)
Write-Host "4. Checking Docker setup..." -ForegroundColor Yellow
if (Test-Path $DockerComposePath) {
    Write-Host "   ✅ docker-compose.yml found" -ForegroundColor Green
    
    # Try to check Docker status
    try {
        $dockerPs = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null
        if ($dockerPs) {
            Write-Host "   📊 Running containers:" -ForegroundColor White
            Write-Host $dockerPs -ForegroundColor White
        } else {
            Write-Host "   ⚠️  No Docker containers running or Docker not accessible" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Docker not accessible or not running" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ docker-compose.yml not found in current directory" -ForegroundColor Red
    Write-Host "   💡 Make sure you're in the Chatwoot directory" -ForegroundColor Yellow
}

# Test 5: Check SSL certificate
Write-Host "5. Testing SSL certificate..." -ForegroundColor Yellow
try {
    $sslTest = Test-NetConnection -ComputerName "chatwoot.mcp4.ai" -Port 443 -InformationLevel Quiet
    if ($sslTest) {
        Write-Host "   ✅ SSL connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ SSL connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ SSL test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Docker Troubleshooting Steps:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Check Docker containers:" -ForegroundColor Yellow
Write-Host "   docker ps" -ForegroundColor White
Write-Host "   docker-compose ps" -ForegroundColor White
Write-Host ""

Write-Host "2. Check Docker logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs chatwoot" -ForegroundColor White
Write-Host "   docker-compose logs postgres" -ForegroundColor White
Write-Host "   docker-compose logs redis" -ForegroundColor White
Write-Host ""

Write-Host "3. Restart Chatwoot services:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor White
Write-Host ""

Write-Host "4. Check environment variables:" -ForegroundColor Yellow
Write-Host "   docker-compose config" -ForegroundColor White
Write-Host ""

Write-Host "5. Check database connection:" -ForegroundColor Yellow
Write-Host "   docker-compose exec postgres psql -U postgres -d chatwoot" -ForegroundColor White
Write-Host ""

Write-Host "6. Check Redis connection:" -ForegroundColor Yellow
Write-Host "   docker-compose exec redis redis-cli ping" -ForegroundColor White
Write-Host ""

Write-Host "Common Docker Issues:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Port conflicts:" -ForegroundColor Yellow
Write-Host "   - Check if ports 3000, 5432, 6379 are available" -ForegroundColor White
Write-Host "   - Use: netstat -an | findstr :3000" -ForegroundColor White
Write-Host ""

Write-Host "2. Database issues:" -ForegroundColor Yellow
Write-Host "   - Check PostgreSQL logs for connection errors" -ForegroundColor White
Write-Host "   - Verify DATABASE_URL in .env file" -ForegroundColor White
Write-Host ""

Write-Host "3. Redis issues:" -ForegroundColor Yellow
Write-Host "   - Check Redis logs for memory/connection issues" -ForegroundColor White
Write-Host "   - Verify REDIS_URL in .env file" -ForegroundColor White
Write-Host ""

Write-Host "4. SSL/HTTPS issues:" -ForegroundColor Yellow
Write-Host "   - Check if SSL certificate is valid" -ForegroundColor White
Write-Host "   - Verify domain configuration" -ForegroundColor White
Write-Host ""

Write-Host "5. Memory issues:" -ForegroundColor Yellow
Write-Host "   - Check Docker memory limits" -ForegroundColor White
Write-Host "   - Monitor container resource usage" -ForegroundColor White
Write-Host ""

Write-Host "Quick Fix Commands:" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

Write-Host "# Stop all containers" -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor Gray
Write-Host ""

Write-Host "# Remove old containers and volumes" -ForegroundColor White
Write-Host "docker-compose down -v" -ForegroundColor Gray
Write-Host ""

Write-Host "# Rebuild and start" -ForegroundColor White
Write-Host "docker-compose up -d --build" -ForegroundColor Gray
Write-Host ""

Write-Host "# Check logs" -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run the diagnostic commands above" -ForegroundColor White
Write-Host "2. Check Docker logs for specific errors" -ForegroundColor White
Write-Host "3. Verify environment variables in .env file" -ForegroundColor White
Write-Host "4. Test Chatwoot admin panel: $ChatwootUrl/app" -ForegroundColor White
