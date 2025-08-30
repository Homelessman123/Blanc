# ContestHub - Danh sách File và Folder cần Backup

## 📁 Các Folder chính cần backup:

### Frontend (Root folder)
- `components/` - Tất cả React components
- `contexts/` - React contexts (AuthContext, CartContext)
- `hooks/` - Custom React hooks
- `pages/` - Các trang chính của ứng dụng
- `services/` - API services và Gemini service
- `utils/` - Utility functions
- `src/` - Source files bổ sung
- `public/` - Static assets (favicon, images)

### Backend
- `backend/src/` - Source code backend
- `backend/prisma/` - Database schema và migrations
- `backend/Dockerfile` - Docker configuration cho backend

### Cấu hình dự án
- `mysql-init/` - Database initialization scripts

## 📄 Các File cấu hình quan trọng:

### Frontend Config
- `package.json` - Dependencies và scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `index.html` - Entry HTML file
- `index.tsx` - React entry point
- `App.tsx` - Main App component
- `style.css` - Global styles

### Backend Config
- `backend/package.json` - Backend dependencies
- `backend/tsconfig.json` - Backend TypeScript config

### Docker & Deployment
- `Dockerfile` - Frontend Docker config
- `docker-compose.yml` - Multi-service orchestration
- `nginx.conf` - Nginx configuration

### Project Info
- `README.md` - Project documentation
- `QUICKSTART.md` - Quick start guide
- `LICENSE` - License file
- `constants.ts` - Application constants
- `types.ts` - TypeScript type definitions
- `metadata.json` - Project metadata

## ❌ File/Folder KHÔNG nên backup:

- `node_modules/` - Dependencies (sẽ được cài lại từ package.json)
- `dist/` - Build output
- `backend/dist/` - Backend build output
- `.env` - Environment variables (chứa thông tin nhạy cảm)
- `backend/.env` - Backend environment variables
- `*.log` - Log files
- `Picture/` - Có thể skip nếu đã có trong public/images/

## 🔒 File cần xử lý đặc biệt:

### Environment Variables
Tạo file template cho environment variables:
- `.env.example` - Template cho frontend env
- `backend/.env.example` - Template cho backend env

### Sensitive Data
- Loại bỏ API keys, database passwords
- Giữ lại cấu trúc nhưng thay thế bằng placeholder values

## 📋 Tóm tắt cấu trúc backup:

```
ContestHub_backup/
├── components/
├── contexts/
├── hooks/
├── pages/
├── services/
├── utils/
├── src/
├── public/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── mysql-init/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── index.tsx
├── App.tsx
├── style.css
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── README.md
├── QUICKSTART.md
├── LICENSE
├── constants.ts
├── types.ts
├── metadata.json
├── .env.example
├── backend/.env.example
└── .gitignore
```
