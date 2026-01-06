# 🚀 Railway Deployment Guide - Blanc

> ⚠️ **Monorepo update (ContestHub_4)**: User app + Admin app đã được gộp vào cùng repo.
> - Backend API: `Dockerfile.backend` (root)
> - User Frontend: `Dockerfile.frontend` (root)
> - Admin Frontend: `apps/admin/Dockerfile` (Railway Root Directory: `apps/admin` *hoặc* Dockerfile Path: `apps/admin/Dockerfile`)
> 
> Phần còn lại của tài liệu có thể nhắc tới branch cũ (`Update_1_User`, `Update_1_Admin`) — xem như **legacy**.

## Tổng quan kiến trúc

## ✅ Cách A (Khuyến nghị): Deploy Admin như service độc lập

Mục tiêu: Railway build **trong thư mục `apps/admin`** như một dự án Vite riêng.
Điều này tránh lỗi kiểu:

`npm error No workspaces found: --workspace=blanc-admin`

Lý do lỗi trên: khi Railway chạy lệnh `npm --workspace=...` nhưng thư mục đang build không có cấu hình `workspaces`.

### Cấu hình Railway cho Admin Service

1) Tạo service mới → chọn GitHub repo

2) Settings
- **Root Directory**: `apps/admin`

3) Build
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile` (vì Root Directory đã là `apps/admin`)

4) Deploy
- Không cần Start Command (image nginx tự chạy)

> Gợi ý: nếu Railway không tự đọc config-as-code trong thư mục root directory,
> hãy set thủ công theo các mục trên (quan trọng nhất là Builder = Dockerfile).

---

## ✅ Cách 2: Deploy Admin bằng npm workspaces (từ repo root)

Dùng cách này nếu bạn muốn dùng các lệnh dạng:

`npm run build --workspace=blanc-admin`

và muốn Railway build từ **repo root** (để `workspaces` được nhận).

### Cấu hình Railway cho Admin Service

1) **Root Directory**: để trống (repo root)

2) **Build**
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.admin`

3) **Custom Build Command**: để trống (không cần)

> Lý do: `Dockerfile.admin` đã build admin bằng `npm -w apps/admin run build`.
> Nếu bạn set Root Directory = `apps/admin` thì npm sẽ báo `No workspaces found`.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Railway Project                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Backend    │  │  User App    │  │  Admin App   │          │
│  │   (API)      │  │  (Frontend)  │  │  (Frontend)  │          │
│  │              │  │              │  │              │          │
│  │ Update_1_User│  │Update_1_User │  │Update_1_Admin│          │
│  │ Dockerfile.  │  │ Dockerfile.  │  │  Dockerfile  │          │
│  │   backend    │  │  frontend    │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  api.blanc.    app.blanc.   admin.blanc.        │
│   railway.app        railway.app       railway.app             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ PostgreSQL / CRDB│
                    │   (External DB)  │
                    └──────────────────┘
```

## Bước 1: Tạo Project trên Railway

1. Đăng nhập [Railway](https://railway.app)
2. Click **"New Project"** → **"Empty Project"**
3. Đặt tên project: `Blanc`

---

## 📋 Giải thích về railway.json

Mỗi branch có file `railway.json` riêng để Railway tự động detect cấu hình:

| Branch | railway.json → Dockerfile | Service |
|--------|---------------------------|---------|
| `Update_1_User` | `Dockerfile.backend` | Backend API |
| `Update_1_Admin` | `Dockerfile` | Admin Frontend |

> ⚠️ **Lưu ý quan trọng**: Khi deploy **User Frontend** từ branch `Update_1_User`, Railway sẽ tự động dùng `Dockerfile.backend` (từ railway.json). Bạn **PHẢI override** thủ công sang `Dockerfile.frontend` trong Railway Settings!

---

## Bước 2: Deploy Backend API

### 2.1 Tạo Service mới
1. Trong project, click **"+ New"** → **"GitHub Repo"**
2. Chọn repo: `Homelessman123/Blanc`
3. Chọn branch: `Update_1_User`

### 2.2 Cấu hình Service
1. Vào **Settings** của service:
   - **Service Name**: `backend-api`
   - **Root Directory**: `/` (để trống hoặc `.`)
   - **Watch Paths**: `server/**`

2. Trong **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.backend`
   
   > ✅ **Tự động**: File `railway.json` trong repo đã cấu hình sẵn `Dockerfile.backend`

3. Trong **Deploy**:
   - **Port**: `4000`

### 2.3 Thêm Environment Variables
Click **"Variables"** → **"Raw Editor"** và paste:

```env
PORT=4000
NODE_ENV=production

# MongoDB Atlas Connection String

# PostgreSQL/CockroachDB Connection String
DATABASE_URL=postgresql://username:password@host:26257/blanc?sslmode=verify-full

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# Frontend Origins (sẽ cập nhật sau khi deploy frontend)
FRONTEND_ORIGIN=https://your-user-app.railway.app,https://your-admin-app.railway.app

# Google Apps Script URLs
MEDIA_MAX_BYTES=26214400
MEDIA_PUBLIC_FOLDERS=avatars,mentor-blog
OTP_EMAIL_URL=https://script.google.com/macros/s/YOUR_OTP_SCRIPT_ID/exec
NOTIFICATION_EMAIL_URL=https://script.google.com/macros/s/YOUR_NOTIFICATION_SCRIPT_ID/exec
OTP_SECRET_KEY=your-otp-secret-key

# OpenRouter API (for AI Chat)
OPENROUTER_API_KEY=your-openrouter-api-key
CHAT_MODEL=google/gemini-2.0-flash-001
```

### 2.4 Generate Domain
1. Vào **Settings** → **Networking** → **Generate Domain**
2. Ghi lại URL, ví dụ: `https://backend-api-production-xxxx.up.railway.app`

---

## Bước 3: Deploy User Frontend

### 3.1 Tạo Service mới
1. Click **"+ New"** → **"GitHub Repo"**
2. Chọn repo: `Homelessman123/Blanc`
3. Chọn branch: `Update_1_User`

### 3.2 Cấu hình Service (⚠️ QUAN TRỌNG - Override railway.json)
1. Vào **Settings**:
   - **Service Name**: `user-frontend`
   - **Root Directory**: `/`

2. Trong **Build** → Click **"Customize"**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.frontend`
   
   > ⚠️ **BẮT BUỘC**: Phải đổi từ `Dockerfile.backend` (mặc định từ railway.json) sang `Dockerfile.frontend`
   > 
   > Railway tự động đọc `railway.json` nên sẽ dùng `Dockerfile.backend`. Bạn PHẢI override thủ công trong Settings!

### 3.3 Thêm Environment Variables
```env
# API URL - Thay bằng URL backend ở bước 2.4
VITE_API_URL=https://backend-api-production-xxxx.up.railway.app/api

# Gemini API (optional)
GEMINI_API_KEY=your-gemini-api-key
```

### 3.4 Generate Domain
- Vào **Settings** → **Networking** → **Generate Domain**
- Ghi lại URL: `https://user-frontend-production-xxxx.up.railway.app`

---

## Bước 4: Deploy Admin Frontend

### 4.1 Tạo Service mới
1. Click **"+ New"** → **"GitHub Repo"**
2. Chọn repo: `Homelessman123/Blanc`
3. Chọn branch: `Update_1_Admin`

### 4.2 Cấu hình Service
1. Vào **Settings**:
   - **Service Name**: `admin-frontend`

2. Trong **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile`
   
   > ✅ **Tự động**: File `railway.json` trong branch `Update_1_Admin` đã cấu hình sẵn `Dockerfile`

### 4.3 Thêm Environment Variables
```env
# API URL - Thay bằng URL backend ở bước 2.4
VITE_API_URL=https://backend-api-production-xxxx.up.railway.app/api

# Gemini API (optional)
GEMINI_API_KEY=your-gemini-api-key
```

### 4.4 Generate Domain
- Vào **Settings** → **Networking** → **Generate Domain**
- Ghi lại URL: `https://admin-frontend-production-xxxx.up.railway.app`

---

## Bước 5: Cập nhật CORS (Quan trọng!)

Quay lại **Backend API** service, cập nhật biến `FRONTEND_ORIGIN`:

```env
FRONTEND_ORIGIN=https://user-frontend-production-xxxx.up.railway.app,https://admin-frontend-production-xxxx.up.railway.app
```

> ⚠️ **Lưu ý**: Thay `xxxx` bằng ID thực tế từ Railway

---

## Bước 6: Cấu hình MongoDB Atlas

### 6.1 Tạo DB (PostgreSQL/CockroachDB)
1. Provision PostgreSQL/CockroachDB ở nhà cung cấp bạn chọn
2. Lấy connection string và set vào `DATABASE_URL` (Raw Editor)
3. Nếu dùng TLS verify-full, đảm bảo CA cert được cấu hình (ví dụ `PGSSLROOTCERT`) theo hướng dẫn của nhà cung cấp

---

## Bước 7: Kiểm tra Deployment

### Health Check
```bash
curl https://backend-api-production-xxxx.up.railway.app/api/health
```

Response mong đợi:
```json
{"status":"ok","timestamp":"2025-11-30T..."}
```

### Test Frontend
- Mở URL User Frontend trong browser
- Thử đăng ký/đăng nhập

---

## 🔧 Troubleshooting

### Build Failed
1. Check logs trong Railway dashboard
2. Đảm bảo Dockerfile path đúng
3. Verify branch đúng

### CORS Error
1. Kiểm tra `FRONTEND_ORIGIN` có đúng URL không
2. Không có trailing slash `/` ở cuối URL
3. Redeploy backend sau khi thay đổi env

### Database Connection Failed
1. Verify `DATABASE_URL` đúng format
2. Verify username/password
3. Verify TLS/CA cert (nếu dùng `sslmode=verify-full`)

### 502 Bad Gateway
1. Check Port đúng (4000 cho backend)
2. Xem logs để biết error cụ thể
3. Có thể RAM/CPU limit - upgrade plan nếu cần

---

## 📊 Estimated Costs

| Service | Railway Hobby ($5/mo) |
|---------|----------------------|
| Backend | ~$2-3/mo |
| User Frontend | ~$1/mo |
| Admin Frontend | ~$1/mo |
| **Total** | ~$4-5/mo |

MongoDB Atlas M0: **FREE**

---

## 🔐 Security Checklist

- [ ] JWT_SECRET là random string dài (32+ chars)
- [ ] DB password mạnh
- [ ] CORS chỉ allow domains cần thiết
- [ ] Không commit .env files
- [ ] Enable 2FA trên Railway và DB provider

---

## Custom Domain (Optional)

1. Mua domain (Namecheap, GoDaddy, etc.)
2. Trong Railway Settings → Custom Domain
3. Add CNAME record trong DNS:
   - `api.yourdomain.com` → backend Railway URL
   - `app.yourdomain.com` → user frontend Railway URL  
   - `admin.yourdomain.com` → admin frontend Railway URL

---

**Done!** 🎉 Your Blanc is now live on Railway!
