# 🚀 Quick Start Guide - ContestHub

## Khởi động nhanh trong 5 phút

### 1. Chuẩn bị môi trường
- ✅ Đã cài **Node.js 18+**
- ✅ Đã cài **XAMPP** và khởi động MySQL
- ✅ Đã tạo database `contesthub` trong phpMyAdmin

### 2. Khởi động Backend API
```bash
# Terminal 1: Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```
🌐 Backend chạy tại: **http://localhost:3001**

### 3. Khởi động Frontend
```bash
# Terminal 2: Frontend (thư mục root)
npm install
npm run dev
```
🌐 Website chạy tại: **http://localhost:5173** hoặc **http://localhost:5174**

### 4. Đăng nhập Demo
- **Admin**: admin@contesthub.com / password
- **User**: user@test.com / password

## ✅ Checklist hoàn thành

### Tính năng đã implement:
- [x] 🔐 **Hệ thống đăng nhập/đăng ký** với JWT authentication
- [x] 🏆 **Quản lý cuộc thi** với database MySQL
- [x] 🛒 **Marketplace** mua bán khóa học
- [x] 🛍️ **Giỏ hàng & đặt hàng** 
- [x] 💰 **Ví ảo & thanh toán**
- [x] 👤 **Cá nhân hóa profile** (màu, avatar, streak)
- [x] 📅 **Calendar system** quản lý sự kiện
- [x] 🔔 **Hệ thống thông báo** real-time
- [x] 💬 **Chat widget** hỗ trợ khách hàng
- [x] 🎨 **UI/UX hiện đại** với animations mượt mà
- [x] 📱 **Responsive design** mobile-friendly
- [x] 🔐 **Phân quyền Admin/User**
- [x] 🌙 **Dark theme** với glass morphism
- [x] ⚡ **Performance optimization**

### Database Schema:
- [x] **Users** table với personalization fields
- [x] **Contests** table với full metadata
- [x] **Products** table cho marketplace
- [x] **Cart & Orders** system
- [x] **Transactions & Wallet** system
- [x] **Calendar Events** integration
- [x] **Notifications** system
- [x] **Chat Messages** storage

### API Endpoints:
- [x] Authentication (login, register, me)
- [x] Contests CRUD operations
- [x] Products & Marketplace
- [x] Shopping Cart management
- [x] Order processing
- [x] Wallet & Payment system
- [x] Calendar events
- [x] Notifications

## 🎯 Features theo yêu cầu

### ✅ Đã hoàn thành:
1. **Website với animations mượt mà** - Framer Motion + Tailwind
2. **Hệ thống đăng nhập/đăng xuất** - JWT + bcryptjs
3. **Giỏ hàng & thanh toán** - Full shopping flow
4. **Calendar integration** - React Calendar với events
5. **Thông báo thông minh** - Notification system
6. **Cá nhân hóa profile** - Colors, avatars, display names
7. **Chat system** - Customer support widget
8. **Admin panel** - Contest & product management
9. **MySQL database** - Prisma ORM với XAMPP
10. **Responsive design** - Mobile-first approach
11. **Ví ảo & rút tiền** - Wallet system với balance
12. **Streak system** - Gamification elements

### 🎨 UI/UX Features:
- **Glass morphism** background effects
- **Gradient animations** & mesh backgrounds
- **Hover effects** & micro-interactions
- **Loading states** với skeleton UI
- **Toast notifications** cho user feedback
- **Dark theme** chủ đạo
- **Custom scrollbars** 
- **Pulse effects** cho important elements

### 🔄 Workflow Features:
- **Auto-add to calendar** khi join contest
- **Smart notifications** về deadlines
- **Commission system** 5% trên giao dịch
- **Product suggestions** theo contest
- **Admin approval** workflow cho products
- **Real-time updates** cho cart & notifications

## 🚀 Next Steps

### Có thể mở rộng thêm:
- [ ] **Socket.io** cho real-time chat
- [ ] **File upload** cho avatars & documents
- [ ] **Email notifications** với SMTP
- [ ] **Payment integration** với PayPal/Stripe
- [ ] **Search functionality** advanced filters
- [ ] **Rating & Review** system
- [ ] **Mobile app** với React Native
- [ ] **AI chatbot** với Google Gemini
- [ ] **Social features** friends & leaderboards
- [ ] **Advanced analytics** dashboard

## 🛠️ Troubleshooting

### Common Issues:
1. **Port 5173 in use**: Frontend tự động chuyển sang port 5174
2. **Database connection**: Kiểm tra XAMPP MySQL service
3. **Dependencies**: Chạy `npm install` trong cả 2 thư mục
4. **Prisma errors**: Chạy `npx prisma generate` để regenerate client

### Performance Tips:
- Đảm bảo XAMPP MySQL optimized
- Clear browser cache nếu có styling issues
- Sử dụng Chrome DevTools để debug
- Check Network tab cho API calls

---

🎉 **Chúc mừng! ContestHub đã sẵn sàng hoạt động với đầy đủ tính năng!** 🎉
