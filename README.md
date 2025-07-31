# Truckie - Transportation Management System

Hệ thống quản lý vận tải với tính năng theo dõi đơn hàng theo thời gian thực qua GPS.

## Hướng dẫn cài đặt cho Developer

### Yêu cầu hệ thống
- Node.js (v16.x hoặc cao hơn)
- npm (v8.x hoặc cao hơn)
- Git

### Các bước cài đặt

1. **Clone dự án**
   ```bash
   git clone https://github.com/your-organization/truckie.git
   cd truckie
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Tạo file biến môi trường**
   - Tạo file `.env` từ file mẫu `.env.example`
   ```bash
   cp .env.example .env
   ```
   - Chỉnh sửa file `.env` với các thông tin cấu hình phù hợp (xem phần "Cấu hình biến môi trường" bên dưới)

4. **Khởi chạy ứng dụng ở môi trường development**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ `http://localhost:5173/` (hoặc cổng khác nếu 5173 đã được sử dụng)

5. **Build ứng dụng cho môi trường production**
   ```bash
   npm run build
   ```
   
6. **Preview bản build**
   ```bash
   npm run preview
   ```

### Xử lý lỗi thường gặp

- **Lỗi "Module not found"**: Đảm bảo đã cài đặt đầy đủ dependencies bằng lệnh `npm install`
- **Lỗi liên quan đến API key**: Kiểm tra file `.env` đã được cấu hình đúng với các API key hợp lệ
- **Lỗi CORS**: Đảm bảo backend API đã được cấu hình để chấp nhận request từ domain development
- **Lỗi port đã được sử dụng**: Nếu port 5173 đã được sử dụng, Vite sẽ tự động chọn port khác, hãy kiểm tra terminal để biết URL chính xác

## Cấu hình biến môi trường

Dự án sử dụng các biến môi trường để cấu hình. Bạn cần tạo file `.env` ở thư mục gốc của dự án với các biến sau:

### API Configuration
```
VITE_API_URL=https://api.truckie.com/v1
VITE_API_TIMEOUT=30000
```

### Authentication
```
VITE_AUTH_TOKEN_KEY=truckie_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=truckie_refresh_token
```

### Map Configuration
```
VITE_VIET_MAPS_API_KEY=your_vietmap_api_key_here
VITE_MAP_DEFAULT_CENTER_LAT=10.762622
VITE_MAP_DEFAULT_CENTER_LNG=106.660172
VITE_MAP_DEFAULT_ZOOM=12
```

### App Configuration
```
VITE_APP_NAME=Truckie
VITE_APP_DESCRIPTION=Transportation Management System with Real-Time GPS Order Tracking
VITE_SUPPORT_EMAIL=support@truckie.com
VITE_SUPPORT_PHONE=02873005588
```

### Feature Flags
```
VITE_FEATURE_LIVE_TRACKING=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_CHAT=false
```

## Cấu trúc dự án

```
src/
├── assets/         # Hình ảnh, fonts và các tài nguyên tĩnh
├── components/     # Các component dùng chung
│   └── layout/     # Layout components (Header, Footer, etc.)
├── config/         # Cấu hình ứng dụng và biến môi trường
├── context/        # React Context API
├── hooks/          # Custom React hooks
├── pages/          # Các trang của ứng dụng
├── routes/         # Cấu hình định tuyến
├── services/       # Các service gọi API
├── types/          # TypeScript type definitions
└── utils/          # Các hàm tiện ích
```

## Công nghệ sử dụng

- React 18
- TypeScript 5
- Ant Design 5
- Tailwind CSS 3
- Axios
- React Router 6
- Vite 4
- MapLibre GL JS (cho bản đồ)
