# API Reference

This document provides detailed information about all API endpoints available in the Zalo Bot SDK.

---

## Message Module

### `sendText(userId, text, options)`

Send a plain text message to a user.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `text` | `string` | Message content (max 1000 characters) |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |
| `options.force` | `boolean` | (Optional) Force send even if user hasn't interacted in 24h |

**Example:**
```javascript
await bot.message.sendText('123456789', 'Hello, world!');
```

**Response:**
```json
{ "message_id": "msg_xyz123", "timestamp": 1623456789 }
```

---

### `sendImage(userId, attachmentId, options)`

Send an image message.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `attachmentId` | `string` | ID from `media.uploadImage()` |
| `options.caption` | `string` | (Optional) Image caption (max 1000 chars) |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |

**Example:**
```javascript
const upload = await bot.media.uploadImage('./photo.jpg');
await bot.message.sendImage('123456789', upload.attachment_id, {
  caption: 'Check this out!'
});
```

---

### `sendFile(userId, attachmentId, options)`

Send a file message.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `attachmentId` | `string` | ID from `media.uploadFile()` |
| `options.caption` | `string` | (Optional) File caption (max 1000 chars) |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |

---

### `sendSticker(userId, stickerId, options)`

Send a sticker message.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `stickerId` | `string` | Sticker ID from Zalo sticker library |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |

---

### `sendTemplate(userId, template, options)`

Send a template message (buttons or list).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `template.type` | `string` | `'button'` or `'list'` |
| `template.elements` | `Array` | Array of button/list elements |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |

**Example:**
```javascript
await bot.message.sendTemplate('123456789', {
  type: 'button',
  elements: [
    { title: 'Yes', payload: 'yes' },
    { title: 'No', payload: 'no' }
  ]
});
```

---

### `sendQuickReply(userId, text, quickReplies, options)`

Send a text message with quick reply buttons.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Recipient user ID |
| `text` | `string` | Message text |
| `quickReplies` | `Array` | Array of `{ title, payload, image_url? }` |
| `options.quoteMessageId` | `string` | (Optional) Message ID to reply to |

**Example:**
```javascript
await bot.message.sendQuickReply('123456789', 'Choose an option:', [
  { title: 'Option A', payload: 'a' },
  { title: 'Option B', payload: 'b' }
]);
```

---

### `getMessage(messageId)`

Retrieve a specific message by ID.

---

### `getConversation(params)`

Get conversation history.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `params.userId` | `string` | (Optional) Filter by user ID |
| `params.limit` | `number` | (Optional) Number of messages (default 50, max 200) |
| `params.cursor` | `string` | (Optional) Pagination cursor |

---

## User Module

### `getProfile(userId, options)`

Get user profile information.

**Example:**
```javascript
const user = await bot.user.getProfile('123456789');
console.log(user.name, user.avatar);
```

---

### `getFollowers(params)`

Get list of followers.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `params.limit` | `number` | (Optional) Number of followers (default 50, max 200) |
| `params.cursor` | `string` | (Optional) Pagination cursor |

---

### `isFollowing(userId)`

Check if a user follows the OA.

**Returns:** `boolean`

---

## Webhook Module

### `verifySignature(signature, rawBody)`

Verify webhook HMAC signature.

**Returns:** `boolean`

---

### `parseEvent(payload)`

Parse incoming webhook payload into a normalized event object.

---

### `middleware(options)`

Express.js middleware for webhook handling.

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `secretKey` | `string` | Override secret key |
| `verifySignature` | `boolean` | Enable signature verification (default: true) |
| `onEvent` | `Function` | Async event handler |

---

## Media Module

### `uploadImage(file, options)`

Upload an image file.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `string` or `Buffer` | File path or Buffer |
| `options.filename` | `string` | (Optional) Custom filename |

**Returns:** `{ attachment_id: string, ... }`

---

### `uploadFile(file, options)`

Upload a file.

---

### `getMediaUrl(attachmentId, options)`

Get media URL by attachment ID.

---

### `downloadMedia(attachmentId, savePath)`

Download a media file to a local path.