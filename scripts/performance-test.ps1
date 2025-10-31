# Voxe Performance Test Script
param(
    [string]$Url = "http://localhost:3000",
    [int]$Tests = 3
)

Write-Host "Voxe Performance Test" -ForegroundColor Green
Write-Host "Testing URL: $Url" -ForegroundColor Yellow
Write-Host "Number of tests: $Tests" -ForegroundColor Yellow
Write-Host ""

$results = @()

for ($i = 1; $i -le $Tests; $i++) {
    Write-Host "Test $i/$Tests..." -NoNewline
    
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        
        $results += [PSCustomObject]@{
            Test = $i
            Duration = [math]::Round($duration, 0)
            Status = $response.StatusCode
            Success = $true
        }
        
        Write-Host " OK $([math]::Round($duration, 0))ms" -ForegroundColor Green
    }
    catch {
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        
        $results += [PSCustomObject]@{
            Test = $i
            Duration = [math]::Round($duration, 0)
            Status = "ERROR"
            Success = $false
        }
        
        Write-Host " ERROR $([math]::Round($duration, 0))ms" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Performance Summary:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$successfulTests = $results | Where-Object { $_.Success }
if ($successfulTests.Count -gt 0) {
    $avgDuration = ($successfulTests | Measure-Object -Property Duration -Average).Average
    $minDuration = ($successfulTests | Measure-Object -Property Duration -Minimum).Minimum
    $maxDuration = ($successfulTests | Measure-Object -Property Duration -Maximum).Maximum
    
    Write-Host "Average Response Time: $([math]::Round($avgDuration, 0))ms" -ForegroundColor White
    Write-Host "Fastest Response: $([math]::Round($minDuration, 0))ms" -ForegroundColor Green
    Write-Host "Slowest Response: $([math]::Round($maxDuration, 0))ms" -ForegroundColor Yellow
    $successRate = [math]::Round(($successfulTests.Count/$Tests)*100, 1)
    Write-Host "Success Rate: $($successfulTests.Count)/$Tests ($successRate%)" -ForegroundColor White
} else {
    Write-Host "No successful tests!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Performance Rating:" -ForegroundColor Cyan
if ($avgDuration -lt 1000) {
    Write-Host "EXCELLENT (< 1s)" -ForegroundColor Green
} elseif ($avgDuration -lt 3000) {
    Write-Host "GOOD (< 3s)" -ForegroundColor Yellow
} elseif ($avgDuration -lt 5000) {
    Write-Host "ACCEPTABLE (< 5s)" -ForegroundColor Orange
} else {
    Write-Host "NEEDS IMPROVEMENT (> 5s)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Tips for better performance:" -ForegroundColor Cyan
Write-Host "- Clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "- Close unnecessary browser tabs" -ForegroundColor White
Write-Host "- Check database connection" -ForegroundColor White
Write-Host "- Monitor server resources" -ForegroundColor White