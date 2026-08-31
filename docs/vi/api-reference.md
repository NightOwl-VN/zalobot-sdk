#!/usr/bin/env python3
"""
Reference doc generator for Zalo Bot Platform API
Based on https://bot.zapps.me/docs/
Output: /var/tools/zalobot/sdk/docs/en/api-reference.md (EN) and /var/tools/zalobot/sdk/docs/vi/api-reference.md (VI)
"""

import re

API_REFERENCE_MD_EN = """# API Reference

Tài liệu tham chiếu API đầy đủ cho Zalo Bot SDK.

> **Zalo Bot API Base URL:** `https://bot-api.zaloplatforms.com/bot{BOT_TOKEN}/{method}`
> **Authentication:** Bot Token embedded in URL path (not in headers)
> **Reference:** https://bot.zapps.me/docs/

---

## Mục lục

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Bot APIs](#bot-apis)
  - [getMe](#getme)
  - [getUpdates](#getupdates)
  - [setWebhook](#setwebhook)
  - [testWebhook](#testwebhook)
  - [deleteWebhook](#deletewebhook)
  - [getWebhookInfo](#getwebhookinfo)
- [Message APIs](#message-apis)
  - [sendMessage](#sendmessage)
  - [sendPhoto](#sendphoto)
  - [sendSticker](#sendsticker)
  - [sendVoice](#sendvoice)
  - [sendChatAction](#sendchataction)
- [Webhook Events](#webhook-events)

---

## Xác thực

Zalo Bot uses **Bot Token** authentication. The token is embedded in the API URL:

```
https://bot-api.zaloplatforms.com/bot{BOT_TOKEN}/{method}
```

**Example:**
```
https://bot-api.zaloplatforms.com/bot123456789:abc-xyz/sendMessage
```

**Bot Token:**
- Format: `123456789:abc-xyz`
- Obtained after creating a bot via Zalo Bot Creator
- Does not expire until manually reset
- Reset: Open Zalo Bot Creator → Settings → Reset Token

---

## Định dạng phản hồi

All Zalo Bot API responses return JSON in this format:

```json
{
  "ok": true,
  "result": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | `true` if the request succeeded |
| `result` | object | Data returned by the API |
| `error_code` | number | Error code (only present when `ok` is false) |
| `description` | string | Error description (only present when `ok` is false) |

---

## API Bot

### getMe

Get bot information. Validates the bot token.

**URL:** `GET /getMe`

**Parameters:** None

**Response:**
```json
{
  "ok": true,
  "result": {
    "id": "1459232241454765289",
    "account_name": "bot.VDKyGxQvc",
    "account_type": "BASIC",
    "can_join_groups": false
  }
}
```

**SDK:**
```javascript
const info = await bot.message.getMe();
console.log(info.result.id);
```

---

### getUpdates

Long-polling: receive updates when no webhook is configured.
**Not available** if webhook is set (use `deleteWebhook` first).

**URL:** `GET /getUpdates`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timeout | number | No | Timeout in seconds (default: 30) |

**Response:** Same as webhook payload format.

**SDK:**
```javascript
const updates = await bot.message.getUpdates({ timeout: 30 });
```

---

### setWebhook

Configure webhook URL to receive events from Zalo.

**URL:** `POST /setWebhook`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | HTTPS webhook URL (must be publicly accessible) |
| secretToken | string | Yes | Secret token (8-256 chars), sent in `X-Bot-Api-Secret-Token` header |

**Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-webhook.com",
    "updated_at": 1749538250568,
    "verification": {
      "ok": true,
      "status_code": 200,
      "outcome": "webhook.ok",
      "latency_ms": 214,
      "hint": "Your endpoint responded successfully."
    }
  }
}
```

**SDK:**
```javascript
await bot.message.setWebhook('https://your-domain.com/webhook', 'your-secret-token');
```

---

### testWebhook

Test the current webhook URL to check connectivity.

**URL:** `POST /testWebhook`

**Parameters:** None

**Response:**
```json
{
  "ok": true,
  "result": {
    "ok": true,
    "url": "https://your-webhook.com",
    "status_code": 200,
    "outcome": "webhook.ok",
    "latency_ms": 214,
    "hint": "Your endpoint responded successfully."
  }
}
```

| outcome | Description |
|---------|-------------|
| `webhook.ok` | Success (2xx response) |
| `webhook.http.403` | Blocked by WAF/CDN |
| `webhook.http.404` | Endpoint not found |
| `webhook.http.5xx` | Server error |
| `webhook.err.tls` | TLS certificate error |
| `webhook.err.dns` | DNS resolution failed |
| `webhook.err.timeout` | Request timeout |
| `webhook.err.blocked` | URL points to localhost/internal IP |

**SDK:**
```javascript
const result = await bot.message.testWebhook();
console.log(result.result.hint);
```

---

### deleteWebhook

Remove webhook configuration (switch back to long polling).

**URL:** `POST /deleteWebhook`

**Parameters:** None

**SDK:**
```javascript
await bot.message.deleteWebhook();
```

---

### getWebhookInfo

Get current webhook configuration status.

**URL:** `GET /getWebhookInfo`

**Parameters:** None

**SDK:**
```javascript
const info = await bot.message.getWebhookInfo();
console.log(info.result.url);
```

---

## API Tin nhắn

### sendMessage

Send a text message.

**URL:** `POST /sendMessage`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | string | Yes | User or chat ID |
| text | string | Yes | Message text (1-2000 chars) |
| text_styles | array | No | Rich text style runs |

**Rich Text (text_styles):**

| Code | Style |
|------|-------|
| `b` | Bold |
| `i` | Italic |
| `u` | Underline |
| `s` | Strikethrough |
| `c_050a19` | Default color |
| `c_15a85f` | Green |
| `c_db342e` | Red |
| `c_f27806` | Orange |
| `c_f7b503` | Yellow |

**SDK:**
```javascript
await bot.message.sendText('chat_id', 'Hello from Bot!');
```

---

### sendPhoto

Send an image message.

**URL:** `POST /sendPhoto`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | string | Yes | User or chat ID |
| photo | string | Yes | Image URL |
| caption | string | No | Image caption (1-2000 chars) |

**SDK:**
```javascript
await bot.message.sendPhoto('chat_id', 'https://example.com/photo.jpg', {
  caption: 'Check this out!'
});
```

---

### sendSticker

Send a sticker.

**URL:** `POST /sendSticker`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | string | Yes | User or chat ID |
| sticker | string | Yes | Sticker ID from stickers.zaloapp.com |

**SDK:**
```javascript
await bot.message.sendSticker('chat_id', 'sticker-id-here');
```

---

### sendVoice

Send a voice message (1-1 chat only).

**URL:** `POST /sendVoice`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | string | Yes | User ID (1-1 only, not groups) |
| voice_url | string | Yes | URL to .aac audio file |

**SDK:**
```javascript
await bot.message.sendVoice('user_id', 'https://example.com/voice.aac');
```

---

### sendChatAction

Show typing indicator.

**URL:** `POST /sendChatAction`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | string | Yes | User or chat ID |
| action | string | Yes | `typing` or `upload_photo` |

**SDK:**
```javascript
await bot.message.sendChatAction('chat_id', 'typing');
```

---

## Sự kiện Webhook

When a user interacts with your bot, Zalo sends a POST request to your webhook URL.

**Headers:**
```
X-Bot-Api-Secret-Token: your-secret-token
Content-Type: application/json
```

**Payload format:**
```json
{
  "ok": true,
  "result": {
    "event_name": "message.text.received",
    "message": {
      "from": {
        "id": "user_id",
        "display_name": "User Name",
        "is_bot": false
      },
      "chat": {
        "id": "chat_id",
        "chat_type": "PRIVATE"
      },
      "text": "Hello!",
      "message_id": "abc123",
      "date": 1750316131602
    }
  }
}
```

### Event Types

| event_name | Description | Message fields |
|------------|-------------|----------------|
| `message.text.received` | Text message | `text` |
| `message.image.received` | Image message | `photo`, `caption` |
| `message.sticker.received` | Sticker | `sticker` |
| `message.voice.received` | Voice message | `voice_url` |
| `message.unsupported.received` | Unsupported message | — |

### SDK Event Names (normalized)

The SDK normalizes event names:

| Zalo Bot event_name | SDK event |
|---------------------|-----------|
| `message.text.received` | `user_text` |
| `message.image.received` | `user_image` |
| `message.sticker.received` | `user_sticker` |
| `message.voice.received` | `user_voice` |

### Lưu ý quan trọng

- Return HTTP 200 within 5 seconds — process logic asynchronously
- Verify `X-Bot-Api-Secret-Token` header before processing
- Webhook URL must be HTTPS and publicly accessible
"""

if __name__ == "__main__":
    with open("/var/tools/zalobot/sdk/docs/en/api-reference.md", "w", encoding="utf-8") as f:
        f.write(API_REFERENCE_MD_EN)
    print("✅ docs/en/api-reference.md written")
