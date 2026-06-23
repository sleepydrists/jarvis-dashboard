# Create GitHub repo and push codebase
# Requires: gh auth login

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path

$RepoName = "jarvis-dashboard"
$Description = "HG Junk Removal JARVIS CRM dashboard — leads, estimator, quotes"

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub CLI not authenticated. Run: gh auth login" -ForegroundColor Yellow
  Write-Host "Then re-run: .\scripts\deploy-github.ps1"
  exit 1
}

$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating GitHub repo: $RepoName ..."
  gh repo create $RepoName --public --source=. --remote=origin --description="$Description" --push
} else {
  Write-Host "Remote already set: $remote"
  git push -u origin main
}

$Url = gh repo view --json url -q .url
Write-Host "GitHub repo: $Url" -ForegroundColor Green

# Save for checklist
@{
  githubUrl = $Url
  updatedAt = (Get-Date).ToString("o")
} | ConvertTo-Json | Set-Content -Path "$RepoRoot\deploy-state.json" -Encoding utf8
