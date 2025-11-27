# Blanc Frontend (Railway)

Nhanh `frontend` chi gom ma nguon giao dien Vite de deploy len Railway hoac cac host tĩnh.

## Bien moi truong (Vite)
Tao `.env` du tren mau `.env.example`:
- `VITE_API_URL` = URL backend (vd: https://your-backend.up.railway.app/api)
- `VITE_SOCKET_URL` = URL socket (vd: https://your-backend.up.railway.app)
- `VITE_APP_NAME`, `VITE_APP_VERSION` tuy chon
- `API_KEY` neu can dung Gemini

## Chay local
```bash
npm ci
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy len Railway (frontend)
1) Chon monorepo path `.` va Dockerfile o thu muc goc (build Vite -> nginx).
2) Dat env VITE_API_URL/VITE_SOCKET_URL tro ve backend (vd: branch `backend` tren Railway).
3) Deploy, Railway se phuc vu tu nginx port 80 trong container.

## Cau truc chinh
- `components/`, `pages/`, `services/`, `contexts/`, `hooks/`, `utils/` – ma nguon React
- `public/` – assets cong khai
- `package.json`, `vite.config.ts`, `tailwind.config.js` – cau hinh build
- `.gitignore` – bo qua `.env`, `node_modules`, `dist` tuoi
