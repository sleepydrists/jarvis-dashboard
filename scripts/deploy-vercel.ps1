# Deploy frontend to Vercel
# Requires: VERCEL_TOKEN env var OR prior `npx vercel login`
# Set VITE_API_URL to your Render API URL before deploy (or in Vercel dashboard after)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$ProjectName = "jarvis-dashboard"
$StateFile = "$RepoRoot\deploy-state.json"

# Read Render API URL if deploy-state has it
$RenderApiUrl = $env:RENDER_API_URL
if (-not $RenderApiUrl -and (Test-Path $StateFile)) {
  $state = Get-Content $StateFile | ConvertFrom-Json
  if ($state.renderApiUrl) { $RenderApiUrl = $state.renderApiUrl }
}

if (-not $RenderApiUrl) {
  Write-Host "RENDER_API_URL not set. Deploy Render first, or set:" -ForegroundColor Yellow
  Write-Host '  $env:RENDER_API_URL = "https://jarvis-api.onrender.com"'
  Write-Host "Continuing — you can set VITE_API_URL in Vercel dashboard later.`n"
}

$vercelArgs = @("vercel", "deploy", "--prod", "--yes", "--name", $ProjectName)
if ($env:VERCEL_TOKEN) {
  $vercelArgs += @("--token", $env:VERCEL_TOKEN)
}

if ($RenderApiUrl) {
  $vercelArgs += @("--env", "VITE_API_URL=$RenderApiUrl")
}

Write-Host "Deploying to Vercel ..."
$output = npx @vercelArgs 2>&1 | Out-String
Write-Host $output

# Parse production URL from output (https://....vercel.app)
$match = [regex]::Match($output, 'https://[^\s]+\.vercel\.app')
if ($match.Success) {
  $vercelUrl = $match.Value.TrimEnd('/')
  Write-Host "Vercel URL: $vercelUrl" -ForegroundColor Green

  $state = @{}
  if (Test-Path $StateFile) { $state = Get-Content $StateFile | ConvertFrom-Json -AsHashtable }
  $state.vercelUrl = $vercelUrl
  $state.updatedAt = (Get-Date).ToString("o")
  $state | ConvertTo-Json | Set-Content -Path $StateFile -Encoding utf8
} else {
  Write-Host "Could not parse Vercel URL from output. Check Vercel dashboard." -ForegroundColor Yellow
}
