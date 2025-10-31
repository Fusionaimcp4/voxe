# Regenerate Demo with Updated Chatwoot Configuration
# This script regenerates a demo with the improved Chatwoot widget script

param(
    [string]$Slug = "formspree-io-517867f7"
)

Write-Host "Regenerating demo with updated Chatwoot configuration..." -ForegroundColor Green
Write-Host "Demo slug: $Slug" -ForegroundColor Yellow
Write-Host ""

# Check if demo exists
$demoPath = "public\demos\$Slug\index.html"
if (-not (Test-Path $demoPath)) {
    Write-Host "❌ Demo not found: $demoPath" -ForegroundColor Red
    Write-Host "Available demos:" -ForegroundColor Yellow
    Get-ChildItem -Path "public\demos" -Directory | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
    exit 1
}

Write-Host "✅ Demo found: $demoPath" -ForegroundColor Green

# Extract current configuration from existing demo
$demoContent = Get-Content $demoPath -Raw
$businessNameMatch = $demoContent | Select-String '<title>([^•]+) • AI Support Demo</title>'
$tokenMatch = $demoContent | Select-String 'websiteToken:\s*"([^"]+)"'

if (-not $businessNameMatch -or -not $tokenMatch) {
    Write-Host "❌ Could not extract configuration from existing demo" -ForegroundColor Red
    exit 1
}

$businessName = $businessNameMatch.Matches[0].Groups[1].Value.Trim()
$websiteToken = $tokenMatch.Matches[0].Groups[1].Value

Write-Host "Business Name: $businessName" -ForegroundColor White
Write-Host "Website Token: $($websiteToken.Substring(0,8))..." -ForegroundColor White

# Import the renderDemo function
try {
    # Read the renderDemo.ts file and extract the function
    $renderDemoContent = Get-Content "lib\renderDemo.ts" -Raw
    
    # Create a temporary Node.js script to regenerate the demo
    $tempScript = @"
const { renderDemoHTML } = require('./lib/renderDemo.ts');

const ctx = {
  businessName: '$businessName',
  slug: '$Slug',
  primary: '#7ee787',
  secondary: '#f4a261',
  chatwootBaseUrl: 'https://chatwoot.mcp4.ai',
  websiteToken: '$websiteToken'
};

const html = renderDemoHTML(ctx);
const fs = require('fs');
fs.writeFileSync('$demoPath', html);
console.log('Demo regenerated successfully');
"@

    $tempScript | Out-File -FilePath "temp-regenerate-demo.js" -Encoding UTF8
    
    Write-Host "🔄 Regenerating demo with updated Chatwoot script..." -ForegroundColor Yellow
    
    # Run the regeneration script
    node temp-regenerate-demo.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Demo regenerated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Updated features:" -ForegroundColor Cyan
        Write-Host "- Added CORS support (crossOrigin='anonymous')" -ForegroundColor White
        Write-Host "- Added error handling and fallback loading" -ForegroundColor White
        Write-Host "- Added console logging for debugging" -ForegroundColor White
        Write-Host "- Added explicit widget configuration" -ForegroundColor White
        Write-Host ""
        Write-Host "Test the demo at: http://localhost:3000/demo/$Slug" -ForegroundColor Green
        Write-Host "Open browser dev tools (F12) to check for any errors" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to regenerate demo" -ForegroundColor Red
    }
    
    # Clean up
    Remove-Item "temp-regenerate-demo.js" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Error regenerating demo: $($_.Exception.Message)" -ForegroundColor Red
}
