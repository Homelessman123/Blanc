# Simple ContestHub Backup Script
# Tạo backup đơn giản với branch backup_1

Write-Host "🚀 Bắt đầu backup ContestHub..." -ForegroundColor Green

# Kiểm tra git remote
Write-Host "🔍 Kiểm tra git remote..." -ForegroundColor Cyan
git remote -v

# Tạo branch mới backup_1 từ main
Write-Host "🌿 Tạo branch backup_1..." -ForegroundColor Cyan
git checkout -b backup_1

# Commit tất cả changes hiện tại (nếu có)
Write-Host "📝 Commit current state..." -ForegroundColor Cyan
git add .
git commit -m "Backup ContestHub to branch backup_1 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Push branch mới lên GitHub
Write-Host "🚀 Push branch backup_1 to GitHub..." -ForegroundColor Cyan
git push -u origin backup_1

Write-Host "✅ Backup hoàn tất!" -ForegroundColor Green
Write-Host "🌿 Branch backup_1 đã được tạo và push lên GitHub" -ForegroundColor Cyan
