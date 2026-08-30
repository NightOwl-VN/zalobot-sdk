# Zalo Bot SDK for Node.js

A comprehensive, lightweight SDK for the [Zalo Bot Platform](https://bot.zapps.me/). Built with TypeScript-ready JavaScript, this SDK provides a clean, modular interface for all Zalo Bot API endpoints with automatic retries, signature verification, and excellent error handling.

## Features

- ✅ **Full API Coverage** - All message types, user management, media uploads, and webhook handling
- ✅ **Automatic Retries** - Built-in retry logic with exponential backoff for rate limits
- ✅ **Webhook Signature Verification** - Secure webhook endpoint with HMAC-SHA256 validation
- ✅ **Zero Dependencies** - Minimal footprint with only `axios` as peer dependency
- ✅ **TypeScript Ready** - Full JSDoc annotations for IDE autocomplete
- ✅ **Modular Architecture** - Clean separation of concerns across modules
- ✅ **Error Handling** - Custom error classes for API, auth, and rate limit errors

## Installation

```bash
npm install zalo-bot-sdk
# or
yarn add zalo-bot-sdk
```

## Quick Start

### 1. Initialize the Bot

```javascript
const { ZaloBot } = require('zalo-bot-sdk');

const bot = new ZaloBot({
  accessToken: 'YOUR_ZALO_ACCESS_TOKEN',
  secretKey: 'YOUR_WEBHOOK_SECRET_KEY', // Optional, for webhook verification
});
```

### 2. Send a Message

```javascript
// Send a text message
await bot.message.sendText('USER_ID', 'Hello from Zalo Bot!');

// Send an image (after uploading)
const upload = await bot.media.uploadImage('/path/to/photo.jpg');
await bot.message.sendImage('USER_ID', upload.attachment_id);

// Send a quick reply message
await bot.message.sendQuickReply('USER_ID', 'Choose an option:', [
  { title: 'Yes', payload: 'yes' },
  { title: 'No', payload: 'no' },
]);
```

### 3. Handle Webhooks (Express)

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// Simple webhook handler
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    if (event.event === 'user_text') {
      await bot.message.sendText(event.userId, `You said: ${event.message.text}`);
    }
  }
}));

app.listen(3000);
```

### 4. Get User Information

```javascript
const user = await bot.user.getProfile('USER_ID');
console.log(`User: ${user.name}, Avatar: ${user.avatar}`);

// Get followers list
const followers = await bot.user.getFollowers({ limit: 50 });
console.log(`Total followers: ${followers.data.length}`);
```

## API Reference

### Core Modules

| Module | Description |
|--------|-------------|
| `bot.message` | Send messages (text, image, file, sticker, template) |
| `bot.user` | Get user profiles and followers |
| `bot.webhook` | Verify signatures and parse webhook events |
| `bot.media` | Upload and manage media files |

### Message Methods

| Method | Description |
|--------|-------------|
| `sendText(userId, text, options)` | Send plain text message |
| `sendImage(userId, attachmentId, options)` | Send image message |
| `sendFile(userId, attachmentId, options)` | Send file message |
| `sendSticker(userId, stickerId, options)` | Send sticker message |
| `sendTemplate(userId, template, options)` | Send template (buttons/list) |
| `sendQuickReply(userId, text, replies, options)` | Send message with quick replies |
| `getMessage(messageId)` | Get message details |
| `getConversation(params)` | Get conversation history |

### User Methods

| Method | Description |
|--------|-------------|
| `getProfile(userId, options)` | Get user profile information |
| `getFollowers(params)` | Get list of followers |
| `isFollowing(userId)` | Check if user follows OA |
| `getProfileCached(userId, options)` | Get profile with caching |

### Webhook Methods

| Method | Description |
|--------|-------------|
| `verifySignature(signature, rawBody)` | Verify HMAC signature |
| `parseEvent(payload)` | Parse webhook event payload |
| `middleware(options)` | Express middleware for webhooks |
| `handle(handler, options)` | Quick webhook handler |

### Media Methods

| Method | Description |
|--------|-------------|
| `uploadImage(file, options)` | Upload image file |
| `uploadFile(file, options)` | Upload file |
| `getMediaUrl(attachmentId, options)` | Get media URL |
| `downloadMedia(attachmentId, savePath)` | Download media to local path |

## Error Handling

The SDK provides custom error classes for different scenarios:

```javascript
const { ZaloApiError, ZaloAuthError, ZaloRateLimitError } = require('zalo-bot-sdk');

try {
  await bot.message.sendText('invalid_user', 'Hello');
} catch (error) {
  if (error instanceof ZaloAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ZaloRateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof ZaloApiError) {
    console.error(`API Error ${error.code}:`, error.message);
  }
}
```

## Environment Variables

Create a `.env` file for configuration:

```env
ZALO_ACCESS_TOKEN=your_access_token
ZALO_SECRET_KEY=your_secret_key
ZALO_TIMEOUT=30000
ZALO_MAX_RETRIES=3
```

Then use:

```javascript
const bot = ZaloBot.fromEnv();
```

## Examples

### Express Webhook Server

```javascript
const express = require('express');
const { ZaloBot } = require('zalo-bot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot({
  accessToken: process.env.ZALO_ACCESS_TOKEN,
  secretKey: process.env.ZALO_SECRET_KEY,
});

// Handle all webhook events
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    console.log(`[${event.event}] from ${event.userId}`);
    
    if (event.event === 'user_text') {
      const text = event.message.text.toLowerCase();
      if (text === 'hi' || text === 'hello') {
        await bot.message.sendText(event.userId, 'Hello there! 👋');
      } else {
        await bot.message.sendText(event.userId, `You said: ${text}`);
      }
    } else if (event.event === 'user_follow') {
      await bot.message.sendText(event.userId, 'Thanks for following! 🎉');
    }
  }
}));

app.listen(3000, () => {
  console.log('Zalo bot running on port 3000');
});
```

### Send Complex Message

```javascript
// Send a message with quick replies and image
const upload = await bot.media.uploadImage('./product.jpg');
await bot.message.sendQuickReply(userId, 'Check out our new product!', [
  { title: 'View Details', payload: 'view_details' },
  { title: 'Buy Now', payload: 'buy_now' },
], { quoteMessageId: messageId });
```

## License

MIT

## Support

- [Zalo Bot API Documentation](https://bot.zapps.me/docs/)
- [Issues](https://github.com/yourusername/zalo-bot-sdk/issues)