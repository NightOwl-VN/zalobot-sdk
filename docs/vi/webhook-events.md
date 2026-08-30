# Sự kiện Webhook

Tài liệu này bao gồm cách thiết lập webhook, xác minh chữ ký và xử lý các sự kiện đến.

---

## Thiết lập Webhook

1. Truy c��p [Zalo Developer Platform](https://developers.zalo.me/)
2. Chọn OA của bạn
3. Vào mục **"Webhook"** trong thanh bên
4. Nhập URL webhook của bạn (phải là HTTPS)
5. Sao chép **Secret Key** — bạn sẽ cần nó để xác minh chữ ký

> ⚠️ **Quan trọng:** Webhook của bạn phải phản hồi `200 OK` trong vòng **5 giây** để xác nhận nhận. Zalo sẽ thử lại tối đa 3 lần nếu không nhận được phản hồi.

---

## Xác minh Chữ ký

Zalo gửi chữ ký HMAC-SHA256 trong header `X-Zalo-Signature`. SDK tự động xử lý xác minh khi bạn sử dụng middleware tích hợp.

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot(); // Secret key được tải từ .env

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    // Nếu chữ ký không hợp lệ, middleware trả về 401
    // Sự kiện chỉ được truyền sau khi xác minh
    console.log('Sự kiện nhận được:', event);
  }
}));
```

**Xác minh thủ công:**
```javascript
const isValid = bot.webhook.verifySignature(
  req.headers['x-zalo-signature'],
  JSON.stringify(req.body)
);
if (!isValid) {
  return res.status(401).json({ error: 'Chữ ký không hợp lệ' });
}
```

---

## Các Loại Sự kiện

### `user_text`

Kích hoạt khi người dùng gửi tin nhắn văn bản.

**Payload:**
```json
{
  "event_name": "user_text",
  "sender": { "id": "123456789" },
  "message_id": "msg_xyz",
  "message": { "text": "Chào bot!" },
  "timestamp": 1623456789
}
```

**Ví dụ xử lý:**
```javascript
if (event.event === 'user_text') {
  const reply = `Bạn vừa gửi: ${event.message.text}`;
  await bot.message.sendText(event.userId, reply);
}
```

---

### `user_quick_reply`

Kích hoạt khi người dùng nhấn nút trả lời nhanh.

**Payload:**
```json
{
  "event_name": "user_quick_reply",
  "sender": { "id": "123456789" },
  "message_id": "msg_xyz",
  "message": {
    "text": "Tôi chọn cái này!",
    "quick_reply": { "payload": "option_a" }
  }
}
```

---

### `user_follow`

Kích hoạt khi người dùng theo dõi OA.

**Ví dụ:**
```javascript
if (event.event === 'user_follow') {
  await bot.message.sendText(event.userId, 'Cảm ơn bạn đã theo dõi! 🎉');
}
```

---

### `user_unfollow`

Kích hoạt khi người dùng hủy theo dõi OA.

---

### `message_delivered`

Kích hoạt khi tin nhắn được gửi thành công.

---

### `message_read`

Kích hoạt khi tin nhắn được đọc.

---

## Thực hành tốt nhất

1. **Luôn xác minh chữ ký** — Ngăn chặn request giả mạo
2. **Phản hồi nhanh** — 200 OK trong 5 giây
3. **Xử lý bất đồng bộ** — Đưa tác vụ nặng vào hàng đợi
4. **Ghi log sự kiện** — Để gỡ lỗi và phân tích
5. **Xử lý lỗi cẩn thận** — Không ném exception trong handler webhook

**Xử lý bất đồng bộ:**
```javascript
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    // Đưa vào hàng đợi nền
    await queue.add('process-event', event);
  }
}));
```

---

## Vấn đề thường gặp

| Vấn đề | Giải pháp |
|--------|-----------|
| `401 Chữ ký không hợp lệ` | Kiểm tra `secretKey` khớp với Zalo Developer Platform |
| `URL Webhook không truy cập được` | Đảm bảo server công khai và dùng HTTPS |
| `Timeout` | Phản hồi 200 OK ngay, xử lý bất đồng bộ |
| `Sự kiện trùng lặp` | Zalo có thể gửi trùng — làm handler idempotent |