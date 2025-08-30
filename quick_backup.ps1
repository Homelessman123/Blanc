# Quick Backup Script - Tạo backup nhanh lên GitHub
# Chạy: .\quick_backup.ps1

Write-Host "🔍 Kiểm tra Git Repository..." -ForegroundColor Cyan

# Kiểm tra git status
Write-Host "`nGit Status hiện tại:" -ForegroundColor Yellow
git status

Write-Host "`nRemote repositories:" -ForegroundColor Yellow  
git remote -v

Write-Host "`nCác branch hiện có:" -ForegroundColor Yellow
git branch -a

# Hỏi người dùng có muốn tiếp tục không
$continue = Read-Host "`n❓ Bạn có muốn tạo backup với branch backup_1? (y/N)"

if ($continue -eq "y" -or $continue -eq "Y") {
    Write-Host "`n🚀 Bắt đầu backup..." -ForegroundColor Green
    
    # Tạo branch backup_1 (hoặc switch nếu đã có)
    $branchExists = git show-ref --verify --quiet refs/heads/backup_1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📝 Branch backup_1 đã tồn tại, switching..." -ForegroundColor Yellow
        git checkout backup_1
    } else {
        Write-Host "🌿 Tạo branch backup_1 mới..." -ForegroundColor Cyan
        git checkout -b backup_1
    }
    
    # Add tất cả files
    Write-Host "📁 Adding all files..." -ForegroundColor Cyan
    git add .
    
    # Commit
    $commitMsg = "Backup ContestHub - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "💾 Committing: $commitMsg" -ForegroundColor Cyan
    git commit -m "$commitMsg"
    
    # Push
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
    git push -u origin backup_1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ BACKUP THÀNH CÔNG!" -ForegroundColor Green
        Write-Host "🌐 Repository: $(git remote get-url origin)" -ForegroundColor Cyan
        Write-Host "🌿 Branch: backup_1" -ForegroundColor Cyan
        Write-Host "📝 Commit: $commitMsg" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Có lỗi xảy ra khi push!" -ForegroundColor Red
    }
    
} else {
    Write-Host "`n⏹️  Backup bị hủy bởi người dùng" -ForegroundColor Yellow
}

Write-Host "`n🎯 Script hoàn tất!" -ForegroundColor White
