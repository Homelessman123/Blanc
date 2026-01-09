# 🔧 Fix Frontend 503 Error - Railway Deployment

## Tình huống
- ✅ Frontend: `blanc.homelabo.work` (Railway)
- ✅ Backend: `blanc-backend.homelabo.work` (Railway)
- ❌ Frontend nhận lỗi 503 khi gọi API

## 🎯 Nguyên nhân chính

### 1. Backend thiếu CORS origin cho frontend domain

Backend cần biết frontend domain để cho phép CORS requests.

### 2. Backend có thể thiếu DATABASE_URL hoặc biến quan trọng khác

## 📋 Bước 1: Kiểm tra Backend Health

Truy cập trực tiếp backend health endpoint:

```
https://blanc-backend.homelabo.work/api/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "services": {
    "database": "healthy",
    "redis": "healthy" // hoặc "unavailable" nếu không dùng Redis
  }
}
```

**Nếu thấy:**
- `"database": "unhealthy"` → Backend thiếu hoặc sai DATABASE_URL
- `"database": "not_initialized"` → DATABASE_URL có placeholder hoặc invalid
- Không load được trang → Backend service chưa start hoặc crashed

## 📋 Bước 2: Fix Railway Backend Environment Variables

Vào **Railway Dashboard** → Project → **blanc-backend service** → **Variables**:

### ✅ Biến BẮT BUỘC:

```bash
# Database (CockroachDB hoặc Railway Postgres)
DATABASE_URL=postgresql://user:pass@host:26257/dbname?sslmode=verify-full

# JWT Secret (random string)
JWT_SECRET=your-random-secret-here-min-32-chars

# CORS - QUAN TRỌNG: Thêm frontend domain
FRONTEND_ORIGIN=https://blanc.homelabo.work

# Node environment
NODE_ENV=production

# Trust proxy (Railway)
TRUST_PROXY=1
```

### ⚠️ Biến OPTIONAL (nhưng nên có):

```bash
# Redis (nếu dùng Railway Redis plugin)
REDIS_URL=${{Redis.REDIS_URL}}

# OTP Email
OTP_EMAIL_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# OpenRouter cho chat
OPENROUTER_API_KEY=sk-or-v1-xxx

# Security
HELMET_CORP=false
JSON_BODY_LIMIT=10mb
```

## 📋 Bước 3: Fix Railway Frontend Environment Variables

Vào **Railway Dashboard** → Project → **blanc-frontend service** → **Variables**:

```bash
# API URL - Trỏ đến backend Railway
VITE_API_URL=https://blanc-backend.homelabo.work/api

# Node environment
NODE_ENV=production
```

## 🔍 Bước 4: Kiểm tra lại sau khi deploy

### 4.1 Test Backend Health:
```bash
curl https://blanc-backend.homelabo.work/api/health
```

### 4.2 Test Backend Ready:
```bash
curl https://blanc-backend.homelabo.work/api/health/ready
```

Kết quả mong đợi:
```json
{
  "ready": true,
  "checks": {
    "database_url": "configured",
    "database_connection": "healthy",
    "database_schema": "ready",
    "redis": "healthy"
  }
}
```

### 4.3 Test CORS từ Frontend:

Mở **DevTools Console** trên `blanc.homelabo.work` và chạy:

```javascript
fetch('https://blanc-backend.homelabo.work/api/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Nếu thấy **CORS error** → Backend chưa có `FRONTEND_ORIGIN` đúng.

## 🐛 Troubleshooting Cụ Thể

### Lỗi: "DATABASE_URL is not set"

**Fix:**
1. Vào Railway Backend service → Variables
2. Thêm hoặc sửa `DATABASE_URL`
3. Nếu dùng Railway Postgres plugin, dùng: `DATABASE_URL=${{Postgres.DATABASE_URL}}`
4. Nếu dùng CockroachDB external, paste connection string đầy đủ
5. Click **Redeploy** backend

### Lỗi: "Failed to fetch" hoặc "CORS error"

**Fix:**
1. Vào Railway Backend service → Variables
2. Thêm: `FRONTEND_ORIGIN=https://blanc.homelabo.work`
3. Nếu có nhiều domain, dùng dấu phẩy: `FRONTEND_ORIGIN=https://blanc.homelabo.work,https://other-domain.com`
4. Click **Redeploy** backend

### Lỗi: "redis unavailable" (nhưng app vẫn chạy)

**Không cần fix urgent** - App có fallback mode. Nếu muốn enable Redis:

1. Vào Railway Project → Add Database → Redis
2. Vào Backend service → Variables → Thêm:
   ```
   REDIS_URL=${{Redis.REDIS_URL}}
   ```
3. Redeploy

### Backend logs show "ECONNREFUSED" hoặc "certificate" errors

**Fix CockroachDB SSL:**
1. Đảm bảo DATABASE_URL có `?sslmode=verify-full`
2. Upload `root.crt` nếu cần (hoặc dùng `sslmode=require`)

### Redis: "ECONNREFUSED 10.162.x.x" hoặc "ETIMEDOUT"

**Nguyên nhân:** Redis service không được "linked" đến backend service, hoặc REDIS_URL sai format.

**Fix Railway Redis (RECOMMENDED):**

1. **Kiểm tra Redis plugin đã được add chưa:**
   - Railway Dashboard → Project → Services
   - Phải có service tên "Redis" với icon Redis

2. **Link Redis đến Backend service:**
   - Click vào Backend service
   - Tab "Settings" → "Service Variables"
   - Click "+ New Variable" → "Add Reference"
   - Chọn: `Redis` service → `REDIS_URL` variable
   - Biến sẽ tự tạo: `REDIS_URL=${{Redis.REDIS_URL}}`

3. **Redeploy backend** sau khi link

**Nếu dùng External Redis (Upstash/Redis Cloud):**

```bash
# Format chuẩn:
REDIS_URL=redis://default:password@host.upstash.io:6379

# Hoặc với TLS:
REDIS_URL=rediss://default:password@host.upstash.io:6380
```

**Nếu muốn DISABLE Redis hoàn toàn:**
- Xóa biến `REDIS_URL` trong Railway Variables
- App sẽ tự fallback mode (no caching)

## ✅ Checklist Nhanh

Backend service cần có:
- [ ] `DATABASE_URL` (valid connection string)
- [ ] `JWT_SECRET` (random 32+ chars)
- [ ] `FRONTEND_ORIGIN=https://blanc.homelabo.work`
- [ ] `NODE_ENV=production`
- [ ] `TRUST_PROXY=1`

Frontend service cần có:
- [ ] `VITE_API_URL=https://blanc-backend.homelabo.work/api`
- [ ] `NODE_ENV=production`

Sau khi set xong:
- [ ] Redeploy backend
- [ ] Redeploy frontend (nếu thay đổi VITE_API_URL)
- [ ] Test `/api/health` và `/api/health/ready`
- [ ] Test frontend load data

## 🚀 Quick Commands

### Kiểm tra backend health:
```bash
curl -i https://blanc-backend.homelabo.work/api/health
```

### Kiểm tra backend có trả CORS headers:
```bash
curl -i -H "Origin: https://blanc.homelabo.work" \
  https://blanc-backend.homelabo.work/api/health
```

Response phải có:
```
Access-Control-Allow-Origin: https://blanc.homelabo.work
Access-Control-Allow-Credentials: true
```

### Set Railway variables qua CLI:
```bash
# Backend
railway link  # chọn backend service
railway variables set FRONTEND_ORIGIN="https://blanc.homelabo.work"
railway variables set DATABASE_URL="postgresql://..."

# Frontend  
railway link  # chọn frontend service
railway variables set VITE_API_URL="https://blanc-backend.homelabo.work/api"
```

## 📞 Nếu vẫn lỗi

1. Check Railway backend logs:
   ```
   railway logs
   ```

2. Tìm dòng có "❌" hoặc "DATABASE_URL"

3. Copy full error message và tìm trong file này hoặc RAILWAY_TROUBLESHOOTING.md
