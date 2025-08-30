# ContestHub Automated Backup Script
# Tự động backup dự án lên GitHub với branch backup_1

param(
    [switch]$CreateEnvTemplates,
    [switch]$Force
)

function Write-StatusMessage {
    param($Message, $Type = "Info")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Type) {
        "Success" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "Error" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "Info" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        default { Write-Host "[$timestamp] $Message" }
    }
}

function Test-GitRepository {
    try {
        git rev-parse --git-dir 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function New-EnvTemplate {
    param($EnvPath, $TemplatePath)
    
    if (Test-Path $EnvPath) {
        $content = Get-Content $EnvPath
        $template = $content | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $key = $matches[1]
                # Giữ nguyên comment lines
                if ($key.StartsWith("#")) {
                    $_
                }
                else {
                    "$key=your_value_here"
                }
            }
            else {
                $_
            }
        }
        $template | Set-Content $TemplatePath
        Write-StatusMessage "Đã tạo template: $TemplatePath" "Success"
        return $true
    }
    return $false
}

# Main script
Write-StatusMessage "🚀 Bắt đầu backup ContestHub..." "Info"

# Kiểm tra git repository
if (-not (Test-GitRepository)) {
    Write-StatusMessage "Thư mục hiện tại không phải là Git repository" "Error"
    exit 1
}

# Kiểm tra working directory clean
$gitStatus = git status --porcelain
if ($gitStatus -and -not $Force) {
    Write-StatusMessage "Working directory có thay đổi chưa commit. Sử dụng -Force để tiếp tục" "Warning"
    Write-Host "Các file thay đổi:"
    git status --short
    exit 1
}

# Tạo .env templates nếu được yêu cầu
if ($CreateEnvTemplates) {
    Write-StatusMessage "🔐 Tạo environment templates..." "Info"
    
    # Frontend .env.example
    if (New-EnvTemplate ".env" ".env.example") {
        git add .env.example
    }
    
    # Backend .env.example
    if (New-EnvTemplate "backend\.env" "backend\.env.example") {
        git add "backend\.env.example"
    }
}

# Lấy branch hiện tại
$currentBranch = git branch --show-current

Write-StatusMessage "Branch hiện tại: $currentBranch" "Info"

# Kiểm tra xem branch backup_1 đã tồn tại chưa
$branchExists = git branch --list "backup_1"
if ($branchExists) {
    Write-StatusMessage "Branch backup_1 đã tồn tại" "Warning"
    if (-not $Force) {
        $choice = Read-Host "Bạn có muốn tiếp tục? (y/N)"
        if ($choice -ne "y" -and $choice -ne "Y") {
            Write-StatusMessage "Backup bị hủy" "Warning"
            exit 0
        }
    }
    # Switch to existing branch
    git checkout backup_1
}
else {
    # Tạo branch mới
    Write-StatusMessage "🌿 Tạo branch backup_1..." "Info"
    git checkout -b backup_1
}

# Add tất cả files
Write-StatusMessage "📝 Adding files to git..." "Info"
git add .

# Commit
$commitMessage = "Backup ContestHub - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-StatusMessage "💾 Committing: $commitMessage" "Info"
git commit -m "$commitMessage"

# Push to remote
Write-StatusMessage "🚀 Pushing to GitHub..." "Info"
try {
    git push -u origin backup_1
    Write-StatusMessage "Backup thành công!" "Success"
    
    # Show remote URL
    $remoteUrl = git remote get-url origin
    Write-StatusMessage "Repository: $remoteUrl" "Info"
    Write-StatusMessage "Branch: backup_1" "Info"
    
}
catch {
    Write-StatusMessage "Lỗi khi push: $($_.Exception.Message)" "Error"
    Write-StatusMessage "Thử push thủ công: git push -u origin backup_1" "Warning"
    exit 1
}

# Switch back to original branch
if ($currentBranch -ne "backup_1") {
    Write-StatusMessage "🔄 Quay về branch: $currentBranch" "Info"
    git checkout $currentBranch
}

Write-StatusMessage "🎉 Backup hoàn tất!" "Success"

# Show summary
Write-Host "`n📋 TÓM TẮT BACKUP:" -ForegroundColor White
Write-Host "  • Repository: $(git remote get-url origin)" -ForegroundColor Cyan
Write-Host "  • Branch: backup_1" -ForegroundColor Cyan  
Write-Host "  • Commit: $commitMessage" -ForegroundColor Cyan
Write-Host "  • Thời gian: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

if ($CreateEnvTemplates) {
    Write-Host "`n🔐 ĐÃ TẠO ENV TEMPLATES:" -ForegroundColor White
    if (Test-Path ".env.example") {
        Write-Host "  • .env.example (frontend)" -ForegroundColor Green
    }
    if (Test-Path "backend\.env.example") {
        Write-Host "  • backend\.env.example (backend)" -ForegroundColor Green
    }
}
