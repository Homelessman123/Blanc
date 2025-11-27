# Blanc Backend (Railway + MongoDB)

Nhanh `backend` duoc toi gon chi gom ma nguon backend phuc vu deploy len Railway voi MongoDB.

## Yeu cau
- Node.js >= 18
- MongoDB (Railway/Atlas)

## Bien moi truong can thiet
Tao `backend/.env` (khong commit) dua tren mau `backend/.env.example`:
- `DATABASE_URL` = mongodb+srv://thhdang12_db_user:haidang123@cluster0.ye7adzm.mongodb.net/contesthub?retryWrites=true&w=majority
- `JWT_SECRET` = chuoi bi mat cua ban
- `CORS_ORIGIN` = domain frontend (vd: https://your-frontend.railway.app)
- `PORT` = de trong de Railway tu cap hoac dat 3001 khi chay local
- `NODE_ENV=production`
- `UPLOAD_DIR=./uploads`, `MAX_FILE_SIZE=10485760` neu can

## Chay local nhanh
```bash
cd backend
npm ci
npx prisma generate --schema prisma/schema.prisma
npm run build
npm start
```

## Deploy len Railway (service backend)
1) Chon monorepo path `backend/` va Dockerfile `backend/Dockerfile`.
2) Set env nhu tren (DATABASE_URL bat buoc).
3) Railway se cap port `$PORT`; ung dung da su dung `process.env.PORT`.

## Cau truc thu muc
- `backend/` – Express + Prisma (MongoDB)
- `backend/prisma/schema.prisma` – schema MongoDB
- `backend/prisma/seed.ts` – seed mau (tuy chon)
- `backend/Dockerfile` – build/runtime backend
- `.gitignore` – da bo qua `.env`, uploads, node_modules, build output
