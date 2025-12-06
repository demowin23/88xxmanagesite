# Hướng dẫn cấu hình SerpAPI (Gói Free)

## 1. Đăng ký tài khoản SerpAPI Free

1. Truy cập: https://serpapi.com/
2. Click "Register" hoặc "Get Started" để đăng ký tài khoản mới
3. Chọn gói **Free** (250 searches/tháng - $0/tháng)
4. Điền thông tin đăng ký:
   - Email
   - Password
   - Tên (optional)
5. Xác thực email qua link được gửi đến inbox
6. Sau khi xác thực, bạn sẽ được tự động vào gói Free

## 2. Lấy API Key

1. Sau khi đăng nhập, vào Dashboard
2. Tìm phần "API Key" hoặc "Account"
3. Copy API Key của bạn

## 3. Cấu hình trong file .env

Mở file `backend/.env` và thêm/cập nhật:

```env
SERPAPI_KEY=your_actual_api_key_here
```

**Lưu ý:** Thay `your_actual_api_key_here` bằng API key thực tế của bạn.

## 4. Test API Key

Sau khi cấu hình, bạn có thể test bằng cách:

### Cách 1: Test qua API endpoint
```bash
# Test với keyword và domain mặc định
curl http://localhost:3000/api/keywords/test/serpapi

# Test với keyword và domain cụ thể
curl "http://localhost:3000/api/keywords/test/serpapi?keyword=seo&domain=example.com"
```

### Cách 2: Test qua code
1. Vào trang "Từ khóa" trong ứng dụng
2. Thêm một keyword
3. Click "Check Ranking"
4. Xem kết quả

## 5. Giới hạn gói Free

**Gói Free bao gồm:**
- ✅ 250 searches/tháng (chỉ tính successful searches)
- ✅ Không có U.S. Legal Shield
- ✅ Đầy đủ tính năng API
- ✅ Không cần thẻ tín dụng

**Lưu ý quan trọng:**
- Chỉ successful searches mới được tính (cached, errored không tính)
- Số lượng results không ảnh hưởng đến credits (1 search = 1 credit)
- Rate limit: ~20% của monthly volume mỗi giờ (khoảng 50 searches/giờ cho gói Free)
- Credits reset vào đầu mỗi tháng

**Khi nào nên nâng cấp:**
- Nếu bạn cần > 250 searches/tháng
- Cần U.S. Legal Shield cho production
- Cần throughput cao hơn

Xem các gói khác tại: https://serpapi.com/pricing

## 6. Cách sử dụng trong ứng dụng

1. **Thêm Website**: Vào "Danh sách Website" → Thêm website
2. **Thêm Keyword**: Vào chi tiết website → Thêm từ khóa
3. **Check Ranking**: Click "Check Ranking" trên từ khóa
4. **Xem lịch sử**: Xem biểu đồ và bảng lịch sử ranking

## 7. Troubleshooting

### Lỗi: "SERPAPI_KEY is not configured"
- Kiểm tra file `.env` có chứa `SERPAPI_KEY`
- Đảm bảo không có khoảng trắng thừa
- Khởi động lại server sau khi thay đổi `.env`

### Lỗi: "Invalid API key"
- Kiểm tra API key đã copy đúng chưa
- Đảm bảo API key còn hiệu lực (chưa hết hạn)
- Kiểm tra tài khoản SerpAPI còn credits

### Lỗi: "Rate limit exceeded"
- Bạn đã vượt quá giới hạn searches trong tháng (250 cho gói Free)
- Kiểm tra usage tại SerpAPI dashboard
- Đợi đến đầu tháng sau để reset credits
- Hoặc nâng cấp plan nếu cần nhiều hơn

### Lưu ý về gói Free:
- **250 searches/tháng** - đủ cho test và dự án nhỏ
- Nếu hết credits, bạn sẽ nhận lỗi "Insufficient credits"
- Credits reset tự động vào đầu mỗi tháng
- Có thể theo dõi usage tại dashboard: https://serpapi.com/dashboard

## 8. Tài liệu tham khảo

- SerpAPI Documentation: https://serpapi.com/search-api
- Google Search API: https://serpapi.com/google-search-api
- API Status: https://serpapi.com/status

