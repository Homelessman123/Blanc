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

## 🚀 Deploy trên Railway

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

## 🏗️ Build Configurations

### Dockerfile chính (Full-stack)
```dockerfile
# Railway sẽ tự động detect file này
Dockerfile
```

**Sử dụng khi**: Deploy full-stack (frontend + backend) trong 1 container

**Ưu điểm**:
- 💰 Chi phí thấp (1 service)
- 🚀 Đơn giản, dễ quản lý
- ⚡ Serving static files từ Node.js

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
