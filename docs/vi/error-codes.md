# Mã lỗi

Tài liệu này liệt kê tất cả các mã lỗi có thể trả về từ Zalo Bot API và cách khắc phục.

---

## Mã lỗi API

| Mã | Mô tả | Giải pháp |
|----|-------|-----------|
| `0` | Thành công | — |
| `-1` | Lỗi hệ thống không xác định | Thử lại sau. Liên hệ Zalo nếu vẫn gặp. |
| `-2` | Tham số không hợp lệ | Kiểm tra định dạng request body và các trường bắt buộc. |
| `-3` | Access Token không hợp lệ hoặc hết hạn | Gia hạn access token trên Zalo Developer Platform. |
| `-4` | Ứng dụng không có quyền truy cập tính năng này | Kiểm tra quyền của OA. |
| `-5` | Secret Key hoặc chữ ký không hợp lệ | Xác minh secret key khớp với Zalo Developer Platform. |
| `-6` | Tài khoản Zalo Bot bị khóa hoặc vô hiệu hóa | Liên hệ Zalo support. |
| `-7` | Người dùng đã chặn bot hoặc chưa tương tác | Yêu cầu người dùng theo dõi hoặc tương tác với bot trước. |
| `-8` | File hoặc media vượt quá kích thước cho phép | Nén file. Kích thước tối đa: 10MB cho ảnh, 20MB cho file. |
| `-9` | Vượt quá giới hạn tần suất gửi tin | Giảm tốc độ request. Tối đa: 30 request/phút cho mỗi access token. |
| `-10` | Yêu cầu không được hỗ trợ hoặc endpoint không tồn tại | Kiểm tra URL API. |
| `-11` | Không tìm thấy người dùng | Xác minh user ID chính xác. |
| `-12` | Hết thời gian chờ | Tối ưu thời gian phản hồi server. Sử dụng xử lý bất đồng bộ. |
| `-13` | Lỗi phân tích định dạng nội dung gửi đi | Kiểm tra định dạng tin nhắn (text, cấu trúc JSON). |

---

## Mã trạng thái HTTP

| Trạng thái | Mô tả | Cách xử lý |
|------------|-------|------------|
| `200` | Thành công | Tiếp tục luồng bình thường. |
| `400` | Yêu cầu không hợp lệ | Kiểm tra tham số và định dạng. |
| `401` | Chưa xác thực | Gia hạn access token. |
| `403` | Từ chối truy cập | Kiểm tra quyền OA. |
| `404` | Không tìm thấy | Xác minh URL endpoint. |
| `429` | Quá nhiều yêu cầu | Đợi và thử lại. SDK tự động thử lại tối đa 3 lần. |
| `500` | Lỗi server nội bộ | Thử lại sau. Liên hệ Zalo nếu vẫn gặp. |

---

## Xử lý lỗi trong Code

```javascript
const { ZaloApiError, ZaloAuthError, ZaloRateLimitError } = require('zalobot-sdk');

try {
  await bot.message.sendText('invalid_user', 'Xin chào');
} catch (error) {
  if (error instanceof ZaloAuthError) {
    console.error('Xác thực thất bại:', error.message);
    // Gia hạn token hoặc yêu cầu xác thực lại
  } else if (error instanceof ZaloRateLimitError) {
    console.error('Giới hạn tần suất. Thử lại sau:', error.retryAfter);
    // Đợi và thử lại
  } else if (error instanceof ZaloApiError) {
    console.error(`Lỗi API ${error.code}:`, error.message);
    // Xử lý mã lỗi cụ thể
  } else {
    console.error('Lỗi không xác định:', error);
  }
}
```

---

## Các kịch bản lỗi phổ biến

### 1. Vượt quá giới hạn tần suất (`-9`)

**Nguyên nhân:** Gửi quá nhiều request trong thời gian ngắn.

**Giải pháp:**
- Sử dụng cơ chế tự động thử lại của SDK (bật mặc định)
- Thêm độ trễ giữa các request
- Gửi tin nhắn theo batch khi có thể

```javascript
// SDK tự động thử lại khi gặp 429
const bot = new ZaloBot({
  maxRetries: 5,  // Tăng số lần thử lại
});
```

### 2. Access Token không hợp lệ (`-3`)

**Nguyên nhân:** Token hết hạn hoặc bị thu hồi.

**Giải pháp:**
- Tạo token mới trên Zalo Developer Platform
- Sử dụng biến môi trường để tránh hardcode
- Thiết lập refresh token nếu sử dụng token dài hạn

### 3. Không tìm thấy người dùng (`-11`)

**Nguyên nhân:** User ID sai hoặc người dùng chưa tương tác với bot.

**Giải pháp:**
- Xác minh user ID từ sự kiện webhook
- Đảm bảo người dùng đã theo dõi OA
- Sử dụng user ID hợp lệ từ Zalo Developer Platform

### 4. Chữ ký Webhook không hợp lệ (`401`)

**Nguyên nhân:** Secret key không khớp hoặc body bị sửa đổi.

**Giải pháp:**
- Xác minh secret key trong `.env` khớp với Zalo Developer Platform
- Đảm bảo bạn đang truyền raw request body (không phải parsed JSON)
- Kiểm tra bạn đang sử dụng đúng tên header (`X-Zalo-Signature`)