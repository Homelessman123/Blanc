# =============================================================================
# RAILWAY DEPLOYMENT SCRIPT (PowerShell)
# =============================================================================
# Run this script to deploy to Railway via CLI
# Install Railway CLI first: npm i -g @railway/cli

Write-Host "🚀 Starting Railway deployment..." -ForegroundColor Cyan

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    Write-Host "📦 Install it with: npm i -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Login check
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Cyan
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in. Running login..." -ForegroundColor Yellow
    railway login
}

# Link to project (if not already linked)
if (-not (Test-Path "railway.json")) {
    Write-Host "🔗 Linking to Railway project..." -ForegroundColor Cyan
    railway link
}

# Show current environment
Write-Host "📊 Current Railway environment:" -ForegroundColor Cyan
railway status

# Deploy
Write-Host "🚢 Deploying to Railway..." -ForegroundColor Cyan
railway up

Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host "📊 Check status: railway status" -ForegroundColor Yellow
Write-Host "📝 View logs: railway logs" -ForegroundColor Yellow
Write-Host "🌐 Open app: railway open" -ForegroundColor Yellow
