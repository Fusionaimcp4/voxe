# Update All Demo Files with Improved Chatwoot Script
# This script updates all existing demo files with the improved Chatwoot widget script

Write-Host "Updating all demo files with improved Chatwoot script..." -ForegroundColor Green
Write-Host ""

$demoDirs = Get-ChildItem -Path "public\demos" -Directory
$updatedCount = 0
$errorCount = 0

foreach ($demoDir in $demoDirs) {
    $demoFile = Join-Path $demoDir.FullName "index.html"
    
    if (Test-Path $demoFile) {
        try {
            Write-Host "Updating: $($demoDir.Name)..." -NoNewline
            
            # Read the current demo file
            $content = Get-Content $demoFile -Raw
            
            # Extract the website token from the current content
            $tokenMatch = $content | Select-String 'websiteToken:\s*"([^"]+)"'
            if ($tokenMatch) {
                $websiteToken = $tokenMatch.Matches[0].Groups[1].Value
                
                # Extract business name from title
                $titleMatch = $content | Select-String '<title>([^•]+) • AI Support Demo</title>'
                $businessName = if ($titleMatch) { $titleMatch.Matches[0].Groups[1].Value.Trim() } else { $demoDir.Name }
                
                # Create the improved script
                $improvedScript = @"
  <script>
    (function(d,t) {
      var BASE_URL="https://chatwoot.mcp4.ai";
      var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
      g.src=BASE_URL+"/packs/js/sdk.js"; 
      g.crossOrigin="anonymous"; // Add CORS support
      s.parentNode.insertBefore(g,s);
      g.onload=function(){
        try {
          window.chatwootSDK.run({ 
            websiteToken: "$websiteToken", 
            baseUrl: BASE_URL,
            // Add additional configuration for self-hosted instances
            hideMessageBubble: false,
            position: 'right',
            locale: 'en',
            type: 'standard'
          });
          if (window.`$chatwoot && window.`$chatwoot.setCustomAttributes) {
            window.`$chatwoot.setCustomAttributes({ business: "$businessName", slug: "$($demoDir.Name)" });
          }
          console.log('Chatwoot widget loaded successfully');
        } catch (error) {
          console.error('Chatwoot widget failed to load:', error);
        }
      };
      g.onerror=function(error) {
        console.error('Failed to load Chatwoot SDK:', error);
        // Fallback: try to load with different CORS settings
        var fallbackScript = d.createElement(t);
        fallbackScript.src = BASE_URL + "/packs/js/sdk.js";
        fallbackScript.onload = function() {
          try {
            window.chatwootSDK.run({ 
              websiteToken: "$websiteToken", 
              baseUrl: BASE_URL 
            });
            console.log('Chatwoot widget loaded via fallback');
          } catch (fallbackError) {
            console.error('Chatwoot fallback also failed:', fallbackError);
          }
        };
        s.parentNode.insertBefore(fallbackScript, s);
      };
    })(document,"script");
  </script>
"@
                
                # Replace the old script with the new one
                $oldScriptPattern = '(?s)<script>\s*\(function\(d,t\)\s*\{.*?\}\)\(document,"script"\);\s*</script>'
                $newContent = $content -replace $oldScriptPattern, $improvedScript
                
                # Write the updated content back to the file
                $newContent | Out-File -FilePath $demoFile -Encoding UTF8
                
                Write-Host " ✅ Updated" -ForegroundColor Green
                $updatedCount++
            } else {
                Write-Host " ⚠️  No website token found" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "Update Summary:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Total demos processed: $($demoDirs.Count)" -ForegroundColor White
Write-Host "Successfully updated: $updatedCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor Red

if ($updatedCount -gt 0) {
    Write-Host ""
    Write-Host "✅ All demo files have been updated with improved Chatwoot script!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Improvements applied:" -ForegroundColor Cyan
    Write-Host "- Added CORS support (crossOrigin='anonymous')" -ForegroundColor White
    Write-Host "- Added error handling and fallback loading" -ForegroundColor White
    Write-Host "- Added console logging for debugging" -ForegroundColor White
    Write-Host "- Added explicit widget configuration" -ForegroundColor White
    Write-Host ""
    Write-Host "Test a demo page:" -ForegroundColor Yellow
    Write-Host "http://localhost:3000/demo/formspree-io-517867f7" -ForegroundColor White
    Write-Host ""
    Write-Host "Open browser dev tools (F12) to check for any errors" -ForegroundColor Yellow
}
