# JARVIS — One-command deploy helpers (Windows PowerShell)
# Run from repo root:  .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Ensure-Path {
  param([string[]]$Dirs)
  $env:Path = ($Dirs -join ";") + ";" + $env:Path
}

Ensure-Path @(
  "C:\Program Files\Git\bin",
  "C:\Program Files\Git\cmd",
  "C:\Program Files\GitHub CLI"
)

Write-Host "=== JARVIS deploy ===" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot`n"

& "$PSScriptRoot\deploy-github.ps1"
& "$PSScriptRoot\deploy-render.ps1"
& "$PSScriptRoot\deploy-vercel.ps1"

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "See DEPLOYMENT_CHECKLIST.md for post-deploy steps (secrets, CORS, website form)."
