# Render deploy via Blueprint (manual trigger helper)
# Render deploys from GitHub — this script opens the Blueprint flow and records expected API URL.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$StateFile = "$RepoRoot\deploy-state.json"
$ServiceName = "jarvis-api"
$ExpectedApiUrl = "https://$ServiceName.onrender.com"

Write-Host "Render deploys from GitHub using render.yaml (Blueprint)." -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Push code to GitHub (run deploy-github.ps1 first)"
Write-Host "2. Open: https://dashboard.render.com/blueprints"
Write-Host "3. New Blueprint Instance -> connect jarvis-dashboard repo"
Write-Host "4. Set secrets when prompted:"
Write-Host "     LEAD_WEBHOOK_SECRET  (generate a long random string)"
Write-Host "     OPENAI_API_KEY       (your sk-... key)"
Write-Host "     ALLOWED_ORIGINS      (see DEPLOYMENT_CHECKLIST.md)"
Write-Host "5. Apply blueprint — service name: $ServiceName"
Write-Host ""
Write-Host "Expected API URL: $ExpectedApiUrl" -ForegroundColor Green
Write-Host "(Confirm in Render dashboard after first deploy.)"
Write-Host ""

$state = @{}
if (Test-Path $StateFile) {
  try { $state = Get-Content $StateFile | ConvertFrom-Json -AsHashtable } catch {}
}
$state.renderApiUrl = $ExpectedApiUrl
$state.renderService = $ServiceName
$state.updatedAt = (Get-Date).ToString("o")
$state | ConvertTo-Json | Set-Content -Path $StateFile -Encoding utf8

# Open Render blueprints if browser available
try {
  Start-Process "https://dashboard.render.com/blueprints"
} catch {
  Write-Host "Open the URL above in your browser."
}
