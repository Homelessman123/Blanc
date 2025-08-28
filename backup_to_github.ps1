# ContestHub Backup Script
# Chạy script này sau khi tạo repository trên GitHub

param(
    [Parameter(Mandatory = $true)]
    [string]$GitHubURL
)

Write-Host "🚀 Starting ContestHub Backup Process..." -ForegroundColor Green

# Kiểm tra git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

# Thêm remote origin nếu chưa có
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
try {
    git remote add origin $GitHubURL
    Write-Host "✅ Remote added successfully!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Remote might already exist, trying to set URL..." -ForegroundColor Yellow
    git remote set-url origin $GitHubURL
}

# Kiểm tra remote
Write-Host "🔍 Checking remotes..." -ForegroundColor Yellow
git remote -v

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "🎉 Backup completed successfully!" -ForegroundColor Green
Write-Host "📂 Repository URL: $GitHubURL" -ForegroundColor Cyan

# Hiển thị thống kê
Write-Host "`n📊 Backup Summary:" -ForegroundColor Magenta
git log --oneline -1
$fileCount = (git ls-files | Measure-Object).Count
Write-Host "📁 Total files backed up: $fileCount" -ForegroundColor Cyan
