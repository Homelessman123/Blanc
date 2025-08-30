# HƯỚNG DẪN BACKUP CONTESTHUB LÊN GITHUB
# Repository: ContestHub_backup
# Branch mới: backup_1

## 🔧 CHUẨN BỊ

### 1. Kiểm tra Git Repository hiện tại
```powershell
cd "C:\Users\thhda\OneDrive\work\ContestHub_2"
git status
git remote -v
```

### 2. Tạo branch backup_1 mới
```powershell
git checkout -b backup_1
```

### 3. Add tất cả file hiện tại
```powershell
git add .
```

### 4. Commit với message backup
```powershell
git commit -m "Backup ContestHub - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
```

### 5. Push branch mới lên GitHub
```powershell
git push -u origin backup_1
```

## 📋 DANH SÁCH FILE/FOLDER QUAN TRỌNG ĐÃ BACKUP

### ✅ Folders đã bao gồm:
- `components/` - React components
- `contexts/` - AuthContext, CartContext
- `hooks/` - Custom hooks
- `pages/` - Các trang chính
- `services/` - API services
- `utils/` - Utility functions
- `src/` - Source files
- `public/` - Static assets
- `backend/` - Backend source code
- `mysql-init/` - Database init scripts

### ✅ Files cấu hình đã bao gồm:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite config
- `tailwind.config.js` - Tailwind config
- `App.tsx` - Main component
- `index.tsx` - Entry point
- `Dockerfile` - Docker config
- `docker-compose.yml` - Multi-service config
- `README.md` - Documentation
- `.gitignore` - Git ignore rules

### ⚠️ Files nhạy cảm (cần xử lý riêng):
- `.env` - Environment variables (chứa API keys, passwords)
- `backend/.env` - Backend environment variables

## 🔐 XỬ LÝ ENVIRONMENT VARIABLES

### Tạo .env.example cho frontend:
```powershell
# Tạo file .env.example từ .env hiện tại
(Get-Content .env) | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        "$($matches[1])=your_value_here"
    } else {
        $_
    }
} | Set-Content .env.example
```

### Tạo .env.example cho backend:
```powershell
# Tạo file backend/.env.example từ backend/.env hiện tại
(Get-Content backend\.env) | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        "$($matches[1])=your_value_here"
    } else {
        $_
    }
} | Set-Content backend\.env.example
```

## 📁 CẤU TRÚC DỰ ÁN SAU KHI BACKUP

```
ContestHub_backup/
├── components/           # React components
├── contexts/            # React contexts
├── hooks/              # Custom hooks
├── pages/              # Main pages
├── services/           # API services
├── utils/              # Utilities
├── src/                # Additional source
├── public/             # Static assets
├── backend/            # Backend source
│   ├── src/           # Backend source code
│   ├── prisma/        # Database schema
│   ├── package.json   # Backend dependencies
│   └── .env.example   # Backend env template
├── mysql-init/         # DB initialization
├── package.json        # Frontend dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite configuration
├── App.tsx            # Main component
├── index.tsx          # Entry point
├── Dockerfile         # Docker config
├── docker-compose.yml # Multi-service config
├── README.md          # Documentation
├── .env.example       # Frontend env template
└── .gitignore         # Git ignore
```

## 🚀 KHÔI PHỤC DỰ ÁN TỪ BACKUP

Khi cần khôi phục dự án từ backup:

```powershell
# Clone repository
git clone https://github.com/Homelessman123/ContestHub_backup.git
cd ContestHub_backup

# Checkout branch backup_1
git checkout backup_1

# Cài đặt frontend
npm install
cp .env.example .env
# Chỉnh sửa .env với giá trị thực tế

# Cài đặt backend
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env với database connection

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Chạy ứng dụng
npm run dev
```

## ✅ CHECKLIST BACKUP

- [ ] Tạo branch backup_1
- [ ] Add tất cả source code
- [ ] Tạo .env.example templates
- [ ] Commit với message backup
- [ ] Push lên GitHub
- [ ] Kiểm tra branch trên GitHub
- [ ] Test clone và setup từ backup

## 📞 SUPPORT

Nếu gặp vấn đề, hãy kiểm tra:
1. Git remote đã được setup đúng
2. Có quyền push lên repository
3. Branch backup_1 đã được tạo thành công
4. File .env đã được tạo template
