# =============================================================================
# RAILWAY DEPLOYMENT GUIDE - ContestHub
# =============================================================================

## 📋 Tổng quan

Dự án này được tối ưu hóa để deploy trên Railway với:
- ✅ Multi-stage build giảm kích thước image
- ✅ Caching layers tối ưu để build nhanh hơn
- ✅ Non-root user cho bảo mật
- ✅ Health checks tự động
- ✅ Redis support (optional)
- ✅ Graceful shutdown handling

## 🚀 Deploy trên Railway (khuyến nghị)

Mục tiêu setup:

- **1 service**: Full-stack **Backend + User Frontend** (dùng `Dockerfile` ở root)
- **1 service**: **Admin Frontend** (dùng `apps/admin/railway.toml` + `apps/admin/Dockerfile`)
- **1 plugin**: **Redis** (Railway Redis) → Railway tự tạo `REDIS_URL`

## 🚀 Deploy trên Railway (Option B - 3 services, tách scale & tách release)

Mục tiêu setup:

- **Service 1: Backend API** (dùng `Dockerfile.backend`)
- **Service 2: User Frontend** (dùng `Dockerfile.frontend`)
- **Service 3: Admin Frontend** (dùng `apps/admin/railway.toml` + `apps/admin/Dockerfile`)
- **Plugin: Redis** (Railway Redis) → Railway tự tạo `REDIS_URL`

### Khi nào chọn Option B?

- Bạn muốn frontend deploy độc lập backend (tách release)
- Bạn muốn scale backend riêng (CPU/RAM) mà không “kéo” frontend theo
- Bạn muốn user/admin có domain riêng (2 apps tách biệt)

### Lưu ý quan trọng về Vite env (`VITE_*`)

- `VITE_*` là **build-time** (Vite sẽ “bake” vào file static)
- Vì vậy trên Railway, bạn cần set `VITE_API_URL` (và `VITE_GEMINI_API_KEY` nếu dùng) dưới dạng **Build Args** của service frontend/admin
- Backend không cần `VITE_*`

### Bước A: Tạo 3 services từ cùng GitHub repo

Trong Railway project:

1) **New Service → GitHub Repo** (Backend)

- Root Directory: repo root
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.backend`
- Healthcheck Path: `/api/health`

2) **New Service → GitHub Repo** (User Frontend)

- Root Directory: repo root
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.frontend`
- Healthcheck Path: `/health` (được cấu hình trong nginx template)

3) **New Service → GitHub Repo** (Admin Frontend)

- Root Directory: `apps/admin`
- Config as code: Railway sẽ tự đọc `apps/admin/railway.toml`

> Nếu bạn cấu hình thủ công trong UI thay vì Config-as-Code, hãy đặt Dockerfile path là `apps/admin/Dockerfile` để tránh Railway chọn nhầm Dockerfile ở repo root.

### Bước B: Set Variables / Build Args cho từng service

#### Service 1 (Backend) - Variables

Xem template: `.env.railway.backend`

Tối thiểu cần:
```
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
JWT_SECRET=<your-secret>
OTP_EMAIL_URL=<...>
OTP_SECRET_KEY=<...>
FRONTEND_ORIGIN=<user-frontend-url>,<admin-url>
TRUST_PROXY=1
```

> `FRONTEND_ORIGIN` nên chứa **cả 2 domain** (User Frontend + Admin) để CORS hoạt động.

#### Service 2 (User Frontend) - Build Args

Xem template: `.env.railway.frontend`

Set build args:
```
VITE_API_URL=https://<your-backend-domain>/api
VITE_GEMINI_API_KEY=<optional>
VITE_CHAT_ENABLED=false
```

#### Service 3 (Admin) - Variables/Build Args

Xem template: `.env.railway.admin`

`apps/admin/railway.toml` đã map:
- `VITE_API_URL` → build arg
- `VITE_GEMINI_API_KEY` → build arg

### Bước C: Add Redis plugin (Recommended)

1. Click **New → Database → Add Redis**
2. Railway tự set `REDIS_URL` cho backend service

### Bước D: Verify nhanh sau deploy

- Backend health: `GET https://<backend-domain>/api/health`
- User frontend: `GET https://<frontend-domain>/health` (returns `ok`)
- Admin frontend: `GET https://<admin-domain>/health` (returns `ok`)

> Lưu ý thực tế: Railway không có nút “Deploy 1 lần cho mọi service” theo kiểu bấm 1 cái là redeploy đồng loạt.
> Cách tiện nhất là **setup 2 services + Redis 1 lần**, sau đó bật **GitHub Autodeploy**: mỗi lần bạn `git push` là cả 2 services tự deploy (Redis là managed plugin).

### Bước 1: Tạo dự án mới trên Railway

1. Đăng nhập vào [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Chọn **"Deploy from GitHub repo"**
4. Chọn repository của bạn

### Bước 2: Cấu hình biến môi trường

Vào **Variables** tab và thêm các biến sau:

#### ✅ Required Variables:
```
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
JWT_SECRET=<your-random-secret>
```

#### 🔐 Email & OTP:
```
OTP_EMAIL_URL=<google-apps-script-url>
NOTIFICATION_EMAIL_URL=<google-apps-script-url>
OTP_SECRET_KEY=<your-otp-secret>
```

#### 🤖 AI Services (Optional):
```
VITE_GEMINI_API_KEY=<your-gemini-key>
OPENROUTER_API_KEY=<your-openrouter-key>
CHAT_MODEL=tngtech/tng-r1t-chimera:free
```

#### 📱 Telegram Notifications (Optional):
```
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
```

#### 🔗 CORS & API:
```
FRONTEND_ORIGIN=https://<your-railway-domain>.railway.app
VITE_API_URL=/api
VITE_CHAT_ENABLED=false
```

#### 🔒 Security:
```
TRUST_PROXY=1
HELMET_CORP=false
JSON_BODY_LIMIT=10mb
REQUIRE_OTP_EMAIL_URL_IN_PROD=true
AUTH_COOKIE_MAX_AGE_MS=86400000
```

### Bước 3: Thêm Redis (Recommended)

#### Option 1: Railway Redis Plugin
1. Click **"New"** → **"Database"** → **"Add Redis"**
2. Railway sẽ tự động tạo biến `REDIS_URL`
3. ✅ Done! Không cần config thêm.

#### Option 2: External Redis (Upstash, Redis Labs)
```
REDIS_URL=redis://username:password@host:port
```

> **Note**: Nếu không dùng Redis, app vẫn hoạt động bình thường (fallback mode)

### Bước 4: Deploy!

Railway sẽ tự động:
- ✅ Detect `Dockerfile`
- ✅ Build image
- ✅ Deploy container
- ✅ Assign public domain

### Bước 4.1: Tạo 2 services (Full-stack + Admin)

1) **Service 1: Full-stack (Backend + User Frontend)**

- Source: GitHub repo (root)
- Builder: Dockerfile
- Dockerfile path: `Dockerfile`
- Start command: `node server/index.js`
- Healthcheck: `/api/health`

2) **Service 2: Admin Frontend**

- Source: cùng GitHub repo
- Root Directory: `apps/admin`
- Config as Code: Railway sẽ tự đọc `apps/admin/railway.toml`

> Nếu bạn không set Root Directory là `apps/admin`, bạn phải trỏ đúng Dockerfile/config cho admin (vì build context khác nhau).

**Alternative (Cách 2 - npm workspaces)**

- Root Directory: repo root
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.admin`

Cách này phù hợp nếu bạn đang dùng các lệnh `npm --workspace=blanc-admin ...` và muốn Railway build từ repo root.

## 🏗️ Build Configurations

### Dockerfile chính (Full-stack: Backend + User Frontend)
```dockerfile
# Railway sẽ tự động detect file này
Dockerfile
```

**Sử dụng khi**: Deploy full-stack (user frontend + backend) trong 1 container

**Ưu điểm**:
- 💰 Chi phí thấp (1 service)
- 🚀 Đơn giản, dễ quản lý
- ⚡ Serving static files từ Node.js (build output trong `dist/`)

### Dockerfile.backend (Backend-only)

**Sử dụng khi**: Deploy backend riêng, frontend deploy ở Vercel/Netlify

**Config Railway**:
```toml
# Thêm vào railway.toml
[build]
dockerfilePath = "Dockerfile.backend"
```

## 📊 Monitoring & Health Checks

Railway tự động check health endpoint:
```
GET /api/health
```

Response khi healthy:
```json
{
  "status": "ok",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "uptime": 3600,
  "timestamp": "2026-01-06T10:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Build fails với "Cannot find module"
**Fix**: Xóa `node_modules` và rebuild:
```bash
git rm -rf node_modules
git commit -m "Remove node_modules"
git push
```

### Redis connection errors
**Fix 1**: Check `REDIS_URL` format:
```
redis://default:password@host:port
```

**Fix 2**: App vẫn chạy được mà không cần Redis (auto fallback)

### Database connection fails
**Fix**: Check `DATABASE_URL` và ensure database accepts connections từ Railway IPs

### Port binding issues
Railway tự động set `PORT` environment variable. Code đã handle:
```javascript
const port = process.env.PORT || 4000;
```

## ⚡ Performance Tips

### 1. Enable Railway Cache
Railway tự động cache Docker layers. Ensure `.dockerignore` đúng để tối ưu cache.

### 2. Redis Configuration
Nếu dùng Railway Redis, tối ưu connection:
```javascript
// server/lib/cache.js đã được config sẵn
maxRetriesPerRequest: 3
enableReadyCheck: true
lazyConnect: true
```

### 3. Database Connection Pooling
PostgreSQL pool đã được tối ưu trong `server/lib/db.js`:
```javascript
max: 20,           // Maximum connections
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 5000
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
Railway tự động deploy khi push to main branch.

Nếu muốn custom workflow:
```yaml
# .github/workflows/railway.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install railway -g
      - run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📈 Scaling

Railway hỗ trợ:
- **Vertical scaling**: Tăng RAM/CPU trong Settings
- **Horizontal scaling**: Enterprise plan (multiple replicas)

Với free plan:
- ✅ 512MB RAM (đủ cho app nhỏ/trung)
- ✅ Shared CPU
- ⚠️ $5 credit/month

## 🔐 Security Checklist

- ✅ Non-root user trong Docker
- ✅ JWT_SECRET phải random và mạnh
- ✅ TRUST_PROXY=1 khi đằng sau Railway proxy
- ✅ HELMET security headers enabled
- ✅ Rate limiting configured
- ✅ CORS restricted to your domain
- ✅ Database credentials in environment variables
- ✅ OTP email URL secured

## 📞 Support

Nếu gặp vấn đề:
1. Check Railway logs: `railway logs`
2. Check health endpoint: `https://<your-domain>.railway.app/api/health`
3. Review [Railway docs](https://docs.railway.app)

---

**Happy Deploying! 🚀**
