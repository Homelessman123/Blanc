# ContestHub Backup Script
# Backup dự án ContestHub lên GitHub repository ContestHub_backup với branch backup_1

param(
    [string]$SourcePath = "C:\Users\thhda\OneDrive\work\ContestHub_2",
    [string]$BackupPath = "C:\Users\thhda\OneDrive\work\ContestHub_backup",
    [string]$RepoUrl = "https://github.com/Homelessman123/ContestHub_backup.git",
    [string]$BranchName = "backup_1"
)

Write-Host "🚀 Bắt đầu backup ContestHub..." -ForegroundColor Green

# Tạo thư mục backup tạm thời
if (Test-Path $BackupPath) {
    Write-Host "⚠️  Thư mục backup đã tồn tại. Xóa và tạo mới..." -ForegroundColor Yellow
    Remove-Item -Path $BackupPath -Recurse -Force
}

New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
Write-Host "📁 Đã tạo thư mục backup: $BackupPath" -ForegroundColor Cyan

# Chuyển đến thư mục backup
Set-Location $BackupPath

# Khởi tạo git repository
Write-Host "🔧 Khởi tạo Git repository..." -ForegroundColor Cyan
git init
git remote add origin $RepoUrl

# Tạo branch mới
Write-Host "🌿 Tạo branch mới: $BranchName" -ForegroundColor Cyan
git checkout -b $BranchName

# Danh sách các folder cần copy
$FoldersToBackup = @(
    "components",
    "contexts", 
    "hooks",
    "pages",
    "services",
    "utils",
    "src",
    "public",
    "backend\src",
    "backend\prisma",
    "mysql-init"
)

# Danh sách các file cần copy
$FilesToBackup = @(
    "package.json",
    "tsconfig.json", 
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "index.html",
    "index.tsx",
    "App.tsx", 
    "style.css",
    "Dockerfile",
    "docker-compose.yml",
    "nginx.conf",
    "README.md",
    "QUICKSTART.md",
    "LICENSE",
    "constants.ts",
    "types.ts",
    "metadata.json",
    "backend\package.json",
    "backend\tsconfig.json",
    "backend\Dockerfile",
    ".gitignore"
)

# Copy folders
Write-Host "📂 Copying folders..." -ForegroundColor Cyan
foreach ($folder in $FoldersToBackup) {
    $sourcePath = Join-Path $SourcePath $folder
    $destPath = Join-Path $BackupPath $folder
    
    if (Test-Path $sourcePath) {
        Write-Host "  ➡️  Copying $folder"
        # Tạo thư mục đích nếu cần
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Recurse -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    } else {
        Write-Host "  ⚠️  Folder không tồn tại: $folder" -ForegroundColor Yellow
    }
}

# Copy files
Write-Host "📄 Copying files..." -ForegroundColor Cyan
foreach ($file in $FilesToBackup) {
    $sourcePath = Join-Path $SourcePath $file
    $destPath = Join-Path $BackupPath $file
    
    if (Test-Path $sourcePath) {
        Write-Host "  ➡️  Copying $file"
        # Tạo thư mục đích nếu cần
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Recurse -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Force
    } else {
        Write-Host "  ⚠️  File không tồn tại: $file" -ForegroundColor Yellow
    }
}

# Tạo file .env.example từ .env (nếu có)
Write-Host "🔐 Tạo environment templates..." -ForegroundColor Cyan

# Frontend .env.example
$frontendEnvPath = Join-Path $SourcePath ".env"
if (Test-Path $frontendEnvPath) {
    $envContent = Get-Content $frontendEnvPath
    $envExample = $envContent | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            "$($matches[1])=your_value_here"
        } else {
            $_
        }
    }
    $envExample | Set-Content (Join-Path $BackupPath ".env.example")
    Write-Host "  ✅ Đã tạo .env.example"
}

# Backend .env.example  
$backendEnvPath = Join-Path $SourcePath "backend\.env"
if (Test-Path $backendEnvPath) {
    $envContent = Get-Content $backendEnvPath
    $envExample = $envContent | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            "$($matches[1])=your_value_here"
        } else {
            $_
        }
    }
    # Tạo thư mục backend nếu chưa có
    $backendDir = Join-Path $BackupPath "backend"
    if (!(Test-Path $backendDir)) {
        New-Item -ItemType Directory -Path $backendDir -Force | Out-Null
    }
    $envExample | Set-Content (Join-Path $BackupPath "backend\.env.example")
    Write-Host "  ✅ Đã tạo backend/.env.example"
}

# Tạo README cho backup
$backupReadme = @"
# ContestHub Backup - Branch: $BranchName

Đây là bản backup của dự án ContestHub được tạo vào $(Get-Date -Format "yyyy-MM-dd HH:mm:ss").

## 🔧 Cài đặt

### Frontend
\`\`\`bash
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế
npm run dev
\`\`\`

### Backend  
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin database và JWT secret
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
\`\`\`

## 📋 Thông tin backup

- **Nguồn**: $SourcePath
- **Ngày backup**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Branch**: $BranchName
- **Commit**: Backup từ ContestHub

## ⚠️ Lưu ý

- File .env đã được thay thế bằng .env.example
- Cần cấu hình lại environment variables
- Cần cài đặt lại node_modules
- Kiểm tra database connection trước khi chạy

"@

$backupReadme | Set-Content (Join-Path $BackupPath "BACKUP_README.md")

# Git add và commit
Write-Host "📝 Adding files to git..." -ForegroundColor Cyan
git add .

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m "Backup ContestHub - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Branch: $BranchName"

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
try {
    git push -u origin $BranchName
    Write-Host "✅ Backup thành công!" -ForegroundColor Green
    Write-Host "🌐 Repository: $RepoUrl" -ForegroundColor Cyan
    Write-Host "🌿 Branch: $BranchName" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Lỗi khi push lên GitHub: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Bạn có thể thử push thủ công:" -ForegroundColor Yellow
    Write-Host "   git push -u origin $BranchName" -ForegroundColor Yellow
}

Write-Host "🎉 Backup hoàn tất!" -ForegroundColor Green
