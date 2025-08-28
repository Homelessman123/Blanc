# ContestHub - Nền tảng Quản lý Cuộc thi và Học tập 🏆

ContestHub là một nền tảng toàn diện giúp học sinh tìm kiếm, tham gia các cuộc thi học thuật và mua các khóa học, tài liệu liên quan. Trang web cung cấp hệ thống quản lý lịch trình, thanh toán, và nhiều tính năng cá nhân hóa với animations mượt mà và UI hiện đại.

## ✨ Tính năng chính

### 🏆 Quản lý Cuộc thi
- Danh sách cuộc thi đa dạng (Olympic Toán, ACM ICPC, IELTS, SAT, v.v.)
- Thông tin chi tiết về mỗi cuộc thi với hình ảnh và mô tả
- Tự động thêm deadline vào calendar khi tham gia
- Hệ thống thông báo nhắc nhở thông minh

### 🛒 Marketplace
- Khóa học online/offline
- Tài liệu luyện thi chuyên sâu
- Workshop và consultation
- Hệ thống đánh giá và review từ học viên

### 📅 Quản lý lịch trình
- Calendar tích hợp với sự kiện cuộc thi
- Nhắc nhở deadline tự động
- Quản lý lịch học và lịch thi cá nhân
- Sync với calendar cá nhân

### 💰 Hệ thống thanh toán & Ví ảo
- Ví ảo tích hợp với số dư hiển thị
- Thanh toán đa dạng (PayPal, thẻ visa)
- Hệ thống rút tiền cho giáo viên/trung tâm
- Commission 5% trên mỗi giao dịch
- Lịch sử giao dịch chi tiết

### 👤 Cá nhân hóa Profile
- Tùy chỉnh màu sắc profile theo sở thích
- Avatar và GIF động đại diện
- Hệ thống streak động lực học tập
- Thay đổi tên hiển thị
- Theme cá nhân hóa

### 💬 Hệ thống Chat & Hỗ trợ
- Chat với hỗ trợ khách hàng 24/7
- AI chatbot thông minh
- Tin nhắn thời gian thực
- Hệ thống ticket support

### 🔐 Phân quyền rõ ràng
- **USER**: Tham gia cuộc thi, mua sản phẩm
- **ADMIN**: Quản lý cuộc thi, duyệt sản phẩm, thống kê
- Chỉ admin có quyền thêm cuộc thi và duyệt nội dung

### 🎨 UI/UX hiện đại
- Dark theme với glass morphism
- Animations mượt mà với Framer Motion
- Responsive design cho mọi thiết bị
- Micro-interactions tăng trải nghiệm
- Loading states và skeleton loading

## 🚀 Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- **Node.js** 18+ 
- **MySQL** (khuyến nghị XAMPP)
- **npm** hoặc yarn

### 1. Chuẩn bị Database MySQL
1. **Khởi động XAMPP** và bật MySQL service
2. **Tạo database** tên `contesthub` trong phpMyAdmin
3. Database schema sẽ được tự động tạo qua Prisma migrations

### 2. Setup Backend API
```bash
cd backend
npm install
```

**File .env đã được cấu hình sẵn:**
```env
DATABASE_URL="mysql://root:@localhost:3306/contesthub"
JWT_SECRET="your_super_secret_jwt_key_here_change_in_production"
PORT=3001
NODE_ENV=development
```

**Chạy database migrations và seed:**
```bash
npx prisma migrate dev
npx prisma db seed
```

**Khởi động backend server:**
```bash
npm run dev
```
🌐 **Backend API:** http://localhost:3001

### 3. Setup Frontend React App
```bash
# Ở thư mục root của dự án
npm install
```

**Khởi động frontend development:**
```bash
npm run dev
```
🌐 **Website:** http://localhost:5173

## 🔑 Tài khoản Demo

### 👑 Admin Account (Quản trị viên)
- **Email:** `admin@contesthub.com`
- **Password:** `password`
- **Quyền hạn:** 
  - Truy cập Admin Dashboard (/admin)
  - Thêm/sửa/xóa cuộc thi
  - Quản lý tất cả sản phẩm
  - Xem thống kê tổng quan
  - Duyệt nội dung từ giáo viên

### 👨‍🎓 User Account (Học sinh)  
- **Email:** `user@test.com`
- **Password:** `password`
- **Quyền hạn:**
  - Tham gia cuộc thi
  - Mua khóa học/tài liệu
  - Quản lý profile cá nhân
  - Sử dụng calendar và thông báo

### 👨‍🏫 Teacher Account (Giáo viên)
- **Email:** `teacher@test.com`  
- **Password:** `password`
- **Quyền hạn:**
  - Đăng bán khóa học
  - Quản lý sản phẩm của mình
  - Rút tiền từ ví ảo
  - Xem thống kê doanh thu

## 🎯 Hướng dẫn sử dụng chi tiết

### Cho Học sinh (USER):
1. **Đăng ký tài khoản** hoặc đăng nhập
2. **Khám phá cuộc thi** tại trang Contests
3. **Tham gia cuộc thi** → tự động add vào calendar cá nhân
4. **Mua khóa học** từ Marketplace với giá ưu đãi
5. **Quản lý lịch trình** học tập và thi cử
6. **Cá nhân hóa profile** với màu sắc và avatar yêu thích
7. **Theo dõi streak** học tập để duy trì động lực

### Cho Admin (ADMIN):
1. **Đăng nhập** với tài khoản admin
2. **Truy cập Admin Dashboard** tại /admin
3. **Thêm cuộc thi mới** với đầy đủ thông tin
4. **Duyệt sản phẩm** từ giáo viên/trung tâm
5. **Quản lý người dùng** và phân quyền
6. **Xem báo cáo** thống kê và doanh thu
7. **Cấu hình hệ thống** và nội dung

### Cho Giáo viên/Trung tâm:
1. **Đăng ký bán** khóa học/tài liệu
2. **Upload nội dung** chất lượng cao
3. **Đợi admin duyệt** sản phẩm
4. **Quản lý đơn hàng** và học viên
5. **Rút tiền** từ ví ảo qua PayPal/bank transfer

## 📱 Tính năng Mobile & PWA

- **Progressive Web App** (PWA) ready
- **Touch-friendly** interface cho mobile
- **Responsive design** hoàn hảo trên mọi thiết bị
- **Offline capability** cho một số tính năng
- **Mobile navigation** tối ưu
- **Swipe gestures** hỗ trợ

## 🎨 Design System & Animations

### UI Components
- **Glass morphism** effects hiện đại
- **Gradient backgrounds** đa dạng
- **Micro-interactions** mượt mà
- **Loading states** với skeleton UI
- **Toast notifications** thông minh

### Animations
- **Framer Motion** cho page transitions
- **Hover effects** trên các elements
- **Scroll animations** khi vào viewport
- **Loading spinners** custom design
- **Button interactions** phản hồi nhanh

### Color Scheme
- **Dark theme** chủ đạo với accents màu
- **Gradient** từ blue → purple → pink
- **Accessibility** friendly với contrast cao
- **Color customization** cho user profiles

## 🏗️ Cấu trúc kỹ thuật

```
ContestHub_2/
├── 🔧 backend/              # Backend API (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── auth/           # Xác thực & phân quyền
│   │   ├── contest/        # Quản lý cuộc thi
│   │   ├── product/        # Sản phẩm & khóa học
│   │   ├── cart/           # Giỏ hàng
│   │   ├── order/          # Xử lý đơn hàng
│   │   ├── wallet/         # Ví ảo & thanh toán
│   │   └── middleware/     # Auth middleware
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Database migrations
│   │   └── seed.ts         # Dữ liệu mẫu
│   └── package.json
├── 🎨 components/          # React components
│   ├── common/            # Components tái sử dụng
│   ├── layout/            # Layout components
│   └── *.tsx             # Feature components
├── 📄 pages/              # Page components
├── 🔗 contexts/           # React contexts (Auth, Cart)
├── 🌐 services/           # API services & HTTP client
├── 📝 types.ts            # TypeScript definitions
├── 🎨 style.css           # Tailwind CSS + custom styles
└── ⚙️ package.json
```

## 🛡️ Bảo mật & Performance

### Security Features
- **JWT Authentication** với refresh tokens
- **Password hashing** với bcryptjs
- **CORS protection** cấu hình chặt chẽ
- **Input validation** & sanitization
- **Rate limiting** chống spam
- **SQL injection** protection với Prisma

### Performance Optimization
- **Code splitting** với React lazy loading
- **Image optimization** tự động
- **API caching** với Redis (future)
- **Database indexing** tối ưu
- **Bundle optimization** với Vite
- **Lazy loading** components

## 🔄 API Documentation

### 🔐 Authentication Endpoints
```bash
POST /api/auth/login          # Đăng nhập user
POST /api/auth/register       # Đăng ký tài khoản mới  
GET  /api/auth/me            # Lấy thông tin user hiện tại
POST /api/auth/refresh       # Refresh JWT token
POST /api/auth/logout        # Đăng xuất
```

### 🏆 Contest Management
```bash
GET  /api/contests                    # Danh sách tất cả cuộc thi
GET  /api/contests/:id               # Chi tiết cuộc thi
POST /api/contests                   # Tạo cuộc thi (Admin)
PUT  /api/contests/:id               # Cập nhật cuộc thi (Admin)
DELETE /api/contests/:id             # Xóa cuộc thi (Admin)
POST /api/contests/:id/participate   # Tham gia cuộc thi
```

### 🛒 Product & Marketplace
```bash
GET  /api/products                      # Danh sách sản phẩm
GET  /api/products/:id                  # Chi tiết sản phẩm
POST /api/products                      # Tạo sản phẩm
PUT  /api/products/:id                  # Cập nhật sản phẩm
DELETE /api/products/:id                # Xóa sản phẩm
GET  /api/products/contest/:contestId   # Sản phẩm liên quan cuộc thi
GET  /api/products/search              # Tìm kiếm sản phẩm
```

### 🛍️ Shopping Cart & Orders
```bash
GET  /api/cart              # Lấy giỏ hàng user
POST /api/cart/items        # Thêm sản phẩm vào giỏ
PUT  /api/cart/items        # Cập nhật số lượng
DELETE /api/cart/items/:id  # Xóa khỏi giỏ hàng
DELETE /api/cart            # Xóa toàn bộ giỏ hàng

POST /api/orders            # Tạo đơn hàng mới
GET  /api/orders            # Lịch sử đơn hàng
GET  /api/orders/:id        # Chi tiết đơn hàng
PUT  /api/orders/:id/status # Cập nhật trạng thái (Admin)
```

### 💰 Wallet & Payment System
```bash
GET  /api/wallet/balance        # Số dư ví hiện tại
POST /api/wallet/deposit        # Nạp tiền vào ví
POST /api/wallet/payout         # Yêu cầu rút tiền
GET  /api/wallet/transactions   # Lịch sử giao dịch
GET  /api/wallet/payouts        # Lịch sử rút tiền
PUT  /api/wallet/payouts/:id    # Duyệt yêu cầu rút tiền (Admin)
```

## 🚀 Deployment & Production

### Production Build
```bash
# Frontend build
npm run build

# Backend build
cd backend
npm run build
npm start
```

### Environment Variables cho Production
```env
# Backend
DATABASE_URL="mysql://user:password@host:port/contesthub"
JWT_SECRET="super-secure-secret-key-256-chars"
NODE_ENV="production"
PORT=3001

# Frontend  
VITE_API_URL="https://your-api-domain.com/api"
VITE_APP_URL="https://your-app-domain.com"
```

### Deployment Options
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Railway, Heroku, DigitalOcean
- **Database**: PlanetScale, AWS RDS, Google Cloud SQL
- **File Storage**: Cloudinary, AWS S3

## 🔧 Development Tools

### Code Quality
- **TypeScript** cho type safety
- **ESLint** cho code linting  
- **Prettier** cho code formatting
- **Husky** cho pre-commit hooks
- **Jest** cho unit testing (future)

### Monitoring & Analytics
- **Error tracking** với Sentry (future)
- **Performance monitoring** với Lighthouse
- **User analytics** với Google Analytics (future)
- **API monitoring** với Uptime Robot (future)

## 🤝 Contribution Guidelines

### Quy trình đóng góp
1. **Fork** repository về GitHub cá nhân
2. **Clone** repo và tạo branch mới
3. **Implement** feature hoặc fix bug
4. **Test** thoroughly trước khi commit
5. **Submit** Pull Request với mô tả chi tiết
6. **Code review** và merge

### Coding Standards
- Sử dụng **TypeScript** cho type safety
- **Component naming** theo PascalCase
- **Function naming** theo camelCase
- **CSS classes** theo kebab-case
- **Git commits** theo Conventional Commits
- **Documentation** đầy đủ cho APIs

## 📞 Support & Community

### Liên hệ hỗ trợ
- **Email**: support@contesthub.com
- **Discord**: ContestHub Community
- **GitHub Issues**: Bug reports & feature requests
- **Documentation**: Comprehensive guides

### Roadmap & Future Features
- [ ] **Mobile App** (React Native)
- [ ] **Video Courses** với streaming
- [ ] **Live Workshops** với Zoom integration  
- [ ] **Gamification** với badges & achievements
- [ ] **Social Features** với friends & leaderboards
- [ ] **AI Recommendations** cho courses
- [ ] **Multi-language** support
- [ ] **Advanced Analytics** dashboard
- [ ] **Plugin System** cho third-party integration

---

<div align="center">

**🏆 ContestHub - Kết nối học sinh với cơ hội học tập và thi đấu tốt nhất! 🚀**

Made with ❤️ by ContestHub Team

[🌐 Website](https://contesthub.com) • [📚 Documentation](https://docs.contesthub.com) • [💬 Discord](https://discord.gg/contesthub) • [🐛 Issues](https://github.com/contesthub/issues)

</div>

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
