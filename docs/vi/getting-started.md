# Bắt đầu

Hướng dẫn này sẽ hướng dẫn bạn từng bước tạo bot Zalo, cài đặt SDK và triển khai lên môi trường production.

---

## Bước 1: Tạo Bot Zalo

1. Truy cập [Zalo Developer Platform](https://developers.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo của bạn
3. Nhấp vào **"Tạo tài khoản chính thức"**
4. Điền tên bot, danh mục và các trường bắt buộc khác
5. Sau khi tạo, vào tab **"Quản lý"**
6. Tại mục **"Access Token"**, sao chép **Access Token** và **Secret Key**

> ⚠️ **Quan trọng:** Lưu trữ các thông tin này một cách an toàn. Access Token dùng để xác thực API, Secret Key dùng để xác minh chữ ký webhook.

---

## Bước 2: Cài đặt SDK

```bash
npm install zalobot-sdk
# hoặc
yarn add zalobot-sdk
```

---

## Bước 3: Cấu hình Biến môi trường

Tạo file `.env` trong thư mục dự án:

```env
ZALO_BOT_ACCESS_TOKEN=your_access_token_here
ZALO_BOT_SECRET_KEY=your_secret_key_here
ZALO_BOT_APP_ID=your_app_id_here  # không bắt buộc
ZALO_BOT_TIMEOUT=30000             # không bắt buộc
ZALO_BOT_MAX_RETRIES=3             # không bắt buộc
```

---

## B��ớc 4: Viết Bot đầu tiên

Tạo file `index.js`:

```javascript
const { ZaloBot } = require('zalobot-sdk');

// Khởi tạo bot — tự động đọc từ .env
const bot = new ZaloBot();

// Gửi tin nhắn thử
await bot.message.sendText('USER_ID', 'Xin chào từ Zalo Bot!');
```

---

## Bước 5: Xử lý Webhook (Express.js)

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot(); // Sử dụng .env

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    if (event.event === 'user_text') {
      await bot.message.sendText(event.userId, `Bạn vừa gửi: ${event.message.text}`);
    }
  }
}));

app.listen(3000, () => console.log('Bot đang chạy trên cổng 3000'));
```

---

## Bước 6: Kiểm tra cục bộ với Tunneling

Để kiểm tra cục bộ, bạn cần expose endpoint webhook bằng công cụ tunneling:

**Dùng ngrok:**
```bash
ngrok http 3000
# Sao chép URL HTTPS và đặt tại Zalo Developer Platform → Webhook
```

**Dùng Cloudflare Tunnel:**
```bash
cloudflared tunnel --url http://localhost:3000
```

Đặt URL được tạo làm webhook endpoint tr��n Zalo Developer Platform.

---

## Bước 7: Triển khai lên Production

### Lựa chọn A: Triển khai trên Render

1. Push code lên GitHub
2. Tạo Web Service mới trên Render
3. Thiết lập biến môi trường
4. Triển khai

### Lựa chọn B: Triển khai trên Railway

1. Push code lên GitHub
2. Tạo project mới trên Railway
3. Thêm biến môi trường
4. Triển khai

### Lựa chọn C: Triển khai trên VPS

```bash
# Clone repository
git clone your-repo
cd your-repo

# Cài đặt dependencies
npm install

# Chạy với PM2 (trình quản lý process cho production)
npm install -g pm2
pm2 start index.js --name zalobot
pm2 save
pm2 startup
```

Cấu hình Nginx làm reverse proxy (tùy chọn).

---

## Các bước tiếp theo

- Xem [Tham chiếu API](./api-reference.md) để biết tất cả các phương thức
- Tìm hiểu về [Sự kiện Webhook](./webhook-events.md) để xử lý tương tác người dùng
- Xem [Mã lỗi](./error-codes.md) để gỡ lỗi