# Chatwoot Widget Diagnostic Script
# This script helps debug Chatwoot widget issues on demo pages

param(
    [string]$DemoUrl = "http://localhost:3000/demo/formspree-io-517867f7",
    [string]$ChatwootBaseUrl = "https://chatwoot.mcp4.ai"
)

Write-Host "Chatwoot Widget Diagnostic" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Test 1: Check if demo page loads
Write-Host "1. Testing demo page accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $DemoUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Demo page loads successfully (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Demo page failed to load: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Check Chatwoot base URL accessibility
Write-Host "2. Testing Chatwoot base URL..." -ForegroundColor Yellow
try {
    $chatwootResponse = Invoke-WebRequest -Uri $ChatwootBaseUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Chatwoot base URL accessible (Status: $($chatwootResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Chatwoot base URL not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check Chatwoot SDK script
Write-Host "3. Testing Chatwoot SDK script..." -ForegroundColor Yellow
try {
    $sdkUrl = "$ChatwootBaseUrl/packs/js/sdk.js"
    $sdkResponse = Invoke-WebRequest -Uri $sdkUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Chatwoot SDK script accessible (Status: $($sdkResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Chatwoot SDK script not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check if website token is valid (basic check)
Write-Host "4. Checking website token..." -ForegroundColor Yellow
try {
    # Extract website token from demo page
    $demoContent = (Invoke-WebRequest -Uri $DemoUrl -UseBasicParsing).Content
    $tokenMatch = $demoContent | Select-String 'websiteToken:\s*"([^"]+)"'
    if ($tokenMatch) {
        $websiteToken = $tokenMatch.Matches[0].Groups[1].Value
        Write-Host "   ✅ Website token found: $($websiteToken.Substring(0,8))..." -ForegroundColor Green
        
        # Test if the token endpoint is accessible
        $tokenUrl = "$ChatwootBaseUrl/api/v1/widget/website_token/$websiteToken"
        try {
            $tokenResponse = Invoke-WebRequest -Uri $tokenUrl -UseBasicParsing -TimeoutSec 10
            Write-Host "   ✅ Website token endpoint accessible" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Website token endpoint not accessible (this might be normal)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ No website token found in demo page" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking website token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Diagnostic Summary:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Common issues and solutions:" -ForegroundColor White
Write-Host "1. CORS Issues:" -ForegroundColor Yellow
Write-Host "   - Check if Chatwoot allows localhost:3000 in CORS settings" -ForegroundColor White
Write-Host "   - Verify Chatwoot instance is properly configured" -ForegroundColor White
Write-Host ""
Write-Host "2. Website Token Issues:" -ForegroundColor Yellow
Write-Host "   - Verify the website token is valid and active" -ForegroundColor White
Write-Host "   - Check if the inbox is active in Chatwoot" -ForegroundColor White
Write-Host ""
Write-Host "3. Network Issues:" -ForegroundColor Yellow
Write-Host "   - Check if Chatwoot instance is running" -ForegroundColor White
Write-Host "   - Verify firewall/network settings" -ForegroundColor White
Write-Host ""
Write-Host "4. Browser Console:" -ForegroundColor Yellow
Write-Host "   - Open browser dev tools (F12)" -ForegroundColor White
Write-Host "   - Check Console tab for JavaScript errors" -ForegroundColor White
Write-Host "   - Check Network tab for failed requests" -ForegroundColor White

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Open the demo page in your browser: $DemoUrl" -ForegroundColor White
Write-Host "2. Open browser dev tools (F12)" -ForegroundColor White
Write-Host "3. Check the Console tab for any errors" -ForegroundColor White
Write-Host "4. Check the Network tab for failed requests to Chatwoot" -ForegroundColor White
