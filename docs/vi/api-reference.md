# Tham chiếu API

Tài liệu này cung cấp thông tin chi tiết về tất cả các API endpoints có sẵn trong Zalo Bot SDK.

---

## Module Tin nhắn

### `sendText(userId, text, options)`

Gửi tin nhắn văn bản đến người dùng.

**Tham số:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `userId` | `string` | ID người nhận |
| `text` | `string` | Nội dung tin nhắn (tối đa 1000 ký tự) |
| `options.quoteMessageId` | `string` | (Tùy chọn) ID tin nhắn để trả lời |
| `options.force` | `boolean` | (Tùy chọn) Gửi ngay cả khi user chưa tương tác trong 24h |

**Ví dụ:**
```javascript
await bot.message.sendText('123456789', 'Xin chào!');
```

**Phản hồi:**
```json
{ "message_id": "msg_xyz123", "timestamp": 1623456789 }
```

---

### `sendImage(userId, attachmentId, options)`

Gửi tin nhắn hình ảnh.

**Tham số:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `userId` | `string` | ID người nhận |
| `attachmentId` | `string` | ID từ `media.uploadImage()` |
| `options.caption` | `string` | (Tùy chọn) Chú thích ảnh (tối đa 1000 ký tự) |
| `options.quoteMessageId` | `string` | (Tùy chọn) ID tin nhắn để trả lời |

**Ví dụ:**
```javascript
const upload = await bot.media.uploadImage('./photo.jpg');
await bot.message.sendImage('123456789', upload.attachment_id, {
  caption: 'Xem này!'
});
```

---

### `sendFile(userId, attachmentId, options)`

Gửi tin nhắn file.

---

### `sendSticker(userId, stickerId, options)`

Gửi sticker.

---

### `sendTemplate(userId, template, options)`

Gửi tin nhắn template (nút bấm hoặc danh sách).

**Ví dụ:**
```javascript
await bot.message.sendTemplate('123456789', {
  type: 'button',
  elements: [
    { title: 'Có', payload: 'yes' },
    { title: 'Không', payload: 'no' }
  ]
});
```

---

### `sendQuickReply(userId, text, quickReplies, options)`

Gửi tin nhắn với nút trả lời nhanh.

**Ví dụ:**
```javascript
await bot.message.sendQuickReply('123456789', 'Chọn một tùy chọn:', [
  { title: 'Tùy chọn A', payload: 'a' },
  { title: 'Tùy chọn B', payload: 'b' }
]);
```

---

### `getMessage(messageId)`

Lấy chi tiết một tin nhắn theo ID.

---

### `getConversation(params)`

Lấy lịch sử hội thoại.

---

## Module Người dùng

### `getProfile(userId, options)`

Lấy thông tin người dùng.

**Ví dụ:**
```javascript
const user = await bot.user.getProfile('123456789');
console.log(user.name, user.avatar);
```

---

### `getFollowers(params)`

Lấy danh sách người theo dõi.

---

### `isFollowing(userId)`

Kiểm tra xem người dùng có theo dõi OA không.

---

## Module Webhook

### `verifySignature(signature, rawBody)`

Xác minh chữ ký HMAC của webhook.

---

### `parseEvent(payload)`

Phân tích payload webhook thành đối tượng sự kiện chuẩn hóa.

---

### `middleware(options)`

Middleware Express.js để xử lý webhook.

---

## Module Media

### `uploadImage(file, options)`

Tải lên file hình ảnh.

**Trả về:** `{ attachment_id: string, ... }`

---

### `uploadFile(file, options)`

Tải lên file.

---

### `getMediaUrl(attachmentId, options)`

Lấy URL media theo attachment ID.

---

### `downloadMedia(attachmentId, savePath)`

Tải media về máy.