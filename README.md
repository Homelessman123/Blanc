# ContestHub

Nền tảng quản lý và khám phá các cuộc thi dành cho học sinh, sinh viên.

## Công nghệ sử dụng

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL (hoặc MongoDB)
- JWT Authentication
- Socket.IO (real-time features)

## Cài đặt

### Yêu cầu
- Node.js >= 18
- MySQL hoặc MongoDB database

### Bước 1: Clone repository
```bash
git clone https://github.com/your-username/ContestHub.git
cd ContestHub
```

### Bước 2: Cài đặt dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Bước 3: Cấu hình môi trường
```bash
# Copy file .env.example
cp .env.example .env
cp backend/.env.example backend/.env

# Chỉnh sửa các biến môi trường trong .env và backend/.env
```

### Bước 4: Khởi chạy database
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Bước 5: Chạy ứng dụng

**Development:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

**Production:**
```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
npm start
```

## Deploy lên Railway

### Backend
1. Tạo project mới trên Railway
2. Connect với GitHub repository
3. Thêm MySQL database addon
4. Set các environment variables từ `backend/.env.example`
5. Deploy

### Frontend
1. Sử dụng Vercel hoặc Netlify để deploy frontend
2. Set `VITE_API_URL` thành URL của backend đã deploy

## Cấu trúc thư mục

```
ContestHub/
├── backend/              # Express backend
│   ├── prisma/          # Prisma schema và migrations
│   ├── src/             # Source code backend
│   └── uploads/         # User uploaded files
├── components/          # React components
├── pages/               # Page components
├── services/            # API services
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── utils/               # Utility functions
└── types/               # TypeScript types
```

## License

MIT License
