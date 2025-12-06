# Hệ thống Quản lý Website

Hệ thống quản lý website với tính năng tự động kiểm tra chặn nhà mạng và theo dõi thứ hạng từ khóa trên Google.

## Tính năng chính

- ✅ Quản lý danh sách website
- ✅ Quản lý Teams (thêm, sửa, xóa teams)
- ✅ Filter website theo tên, trạng thái, team
- ✅ Tự động kiểm tra website bị chặn bởi nhà mạng (Viettel, VNPT, FPT, Mobifone, SCTV, CMC)
- ✅ Tự động check thứ hạng từ khóa trên Google bằng SerpAPI
- ✅ Dashboard tổng quan với biểu đồ thống kê
- ✅ Scheduler tự động chạy định kỳ
- ✅ Giao diện quản lý trực quan

## Kiến trúc hệ thống

```
├── backend/          # API Server (Node.js/Express)
│   ├── config/       # Cấu hình database
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── services/     # Business logic (SerpAPI, Proxy Checker, Scheduler)
│   └── scripts/      # Migration scripts
│
└── frontend/         # Web App (Vue.js)
    ├── src/
    │   ├── views/    # Các trang chính
    │   ├── services/ # API client
    │   └── router/   # Vue Router
```

## Cài đặt

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cấu hình `.env` (tạo file `.env` trong thư mục backend):
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=website_management
DB_USER=postgres
DB_PASSWORD=postgres

# SerpAPI Configuration (optional)
SERPAPI_KEY=your_serpapi_key_here
```

5. Tạo database PostgreSQL:
```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE website_management;

# Thoát
\q
```

6. Chạy migration để tạo các bảng:
```bash
npm run migrate
```

6. Khởi động server:
```bash
npm start
# hoặc cho development
npm run dev
```

### Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Khởi động development server:
```bash
npm run dev
```

4. Mở trình duyệt tại: `http://localhost:5173`

## Cấu hình

### SerpAPI

1. Đăng ký tài khoản tại [SerpAPI](https://serpapi.com/)
2. Lấy API key từ dashboard
3. Thêm vào file `.env` của backend: `SERPAPI_API_KEY=your_key_here`

### Proxy ISP

1. Cần có proxy cho mỗi nhà mạng muốn kiểm tra
2. Format proxy URL: `http://username:password@ip:port`
3. Thêm proxy qua giao diện hoặc API:
   - Vào trang "Quản lý Proxy"
   - Click "Thêm Proxy"
   - Chọn nhà mạng và nhập proxy URL

## Sử dụng

### Quản lý Teams

1. Vào trang "Quản lý Teams"
2. Click "Thêm Team" để tạo team mới
3. Điền tên team và mô tả (nếu có)
4. Có thể sửa hoặc xóa team sau khi tạo

### Quản lý Website

1. Vào trang "Danh sách Website"
2. Sử dụng bộ lọc để tìm website theo:
   - Tên domain (tìm kiếm)
   - Trạng thái (active, redirect, error, blocked)
   - Team
3. Click "Thêm Website" để thêm website mới
4. Chọn team từ dropdown (danh sách teams được load từ API)
5. Điền thông tin: domain, team, loại, trạng thái, ghi chú
6. Click "Check chặn" để kiểm tra ngay hoặc đợi scheduler tự động

### Kiểm tra chặn

- **Thủ công**: Click nút "Check chặn" trên từng website
- **Tự động**: Scheduler chạy mỗi 6 giờ một lần
- **Kết quả**: Hiển thị trạng thái chặn theo từng nhà mạng (OK, BLOCK_DNS, BLOCK_HTTP, BLOCK_HTTPS, BLOCK_UNKNOWN)

### Quản lý Từ khóa

1. Vào trang chi tiết website
2. Click "Thêm từ khóa"
3. Nhập từ khóa, target URL (nếu có), ghi chú
4. Click "Check Ranking" để kiểm tra thứ hạng
5. Xem lịch sử ranking qua biểu đồ và bảng

### Dashboard

Dashboard hiển thị:
- Tổng số website và từ khóa
- Số website bị chặn trong 24h
- Biểu đồ thống kê chặn theo nhà mạng
- Danh sách website bị chặn gần đây
- Thay đổi ranking gần đây

## API Endpoints

### Teams
- `GET /api/teams` - Lấy danh sách teams
- `GET /api/teams/:id` - Lấy chi tiết team
- `POST /api/teams` - Tạo team mới
- `PUT /api/teams/:id` - Cập nhật team
- `DELETE /api/teams/:id` - Xóa team

### Websites
- `GET /api/websites` - Lấy danh sách website (có filter: ?search=, ?status=, ?team_id=)
- `GET /api/websites/:id` - Lấy chi tiết website
- `POST /api/websites` - Tạo website mới
- `PUT /api/websites/:id` - Cập nhật website
- `DELETE /api/websites/:id` - Xóa website
- `GET /api/websites/:id/block-status` - Lấy lịch sử chặn

### Proxies
- `GET /api/proxies` - Lấy danh sách proxy
- `GET /api/proxies/active` - Lấy proxy đang hoạt động
- `POST /api/proxies` - Tạo proxy mới
- `PUT /api/proxies/:id` - Cập nhật proxy
- `DELETE /api/proxies/:id` - Xóa proxy
- `POST /api/proxies/:id/test` - Test proxy

### Block Check
- `POST /api/block-check/check/:websiteId` - Check chặn cho một website
- `POST /api/block-check/check-batch` - Check chặn cho nhiều website

### Keywords
- `GET /api/keywords/website/:websiteId` - Lấy keywords của website
- `GET /api/keywords/:id` - Lấy chi tiết keyword
- `POST /api/keywords` - Tạo keyword mới
- `PUT /api/keywords/:id` - Cập nhật keyword
- `DELETE /api/keywords/:id` - Xóa keyword
- `POST /api/keywords/:id/check-ranking` - Check ranking
- `GET /api/keywords/:id/rank-history` - Lấy lịch sử ranking

### Dashboard
- `GET /api/dashboard/overview` - Tổng quan dashboard
- `GET /api/dashboard/blocked-websites` - Website bị chặn
- `GET /api/dashboard/ranking-changes` - Thay đổi ranking

## Scheduler

Hệ thống tự động chạy các tác vụ định kỳ:

- **Check chặn**: Mỗi 6 giờ một lần
- **Check ranking**: Mỗi ngày lúc 2:00 AM

Có thể tùy chỉnh trong file `backend/services/scheduler.js`

## Database Schema

### teams
- id, name, description, created_at, updated_at

### website
- id, domain, team_id (FK to teams), type, status, note, created_at, updated_at

### proxy_isp
- id, isp_name, proxy_url, status, last_check, created_at, updated_at

### website_block_status
- id, website_id, isp_name, status, http_code, error_message, checked_at

### website_keywords
- id, website_id, keyword, target_url, note, is_active, created_at, updated_at

### keyword_rank_history
- id, website_keyword_id, position, found_url, serpapi_search_id, checked_at

## Bảo mật

- ✅ API key SerpAPI lưu trong biến môi trường
- ✅ Proxy yêu cầu xác thực
- ✅ CORS được cấu hình
- ✅ Input validation

## Lưu ý

1. **SerpAPI Rate Limit**: Hệ thống tự động delay giữa các request để tránh vượt quá giới hạn
2. **Proxy Timeout**: Mặc định 10 giây, có thể điều chỉnh trong `proxyChecker.js`
3. **Database**: Sử dụng PostgreSQL, cần cài đặt và cấu hình PostgreSQL trước khi chạy
4. **Scheduler**: Chạy trong cùng process với server, có thể tách ra thành service riêng

## Phát triển tiếp

- [ ] Thêm cảnh báo Telegram/Email
- [ ] Export báo cáo PDF/Excel
- [ ] Phân quyền user nâng cao
- [ ] API rate limiting
- [ ] Logging chi tiết
- [ ] Webhook notifications

## License

ISC



