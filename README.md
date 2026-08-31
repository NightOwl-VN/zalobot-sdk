# Zalo Bot SDK

[![npm version](https://img.shields.io/npm/v/zalobot-sdk.svg)](https://www.npmjs.com/package/zalobot-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Support-blue.svg)](./types/)
[![CI](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](https://github.com/NightOwl-VN/zalobot-sdk/actions)

> A lightweight, modular, and enterprise-ready Node.js SDK and Webhook handler for the
> [Zalo Bot Platform API](https://bot-api.zaloplatforms.com). It provides full coverage of
> messaging, user, media, and webhook endpoints with automatic exponential-backoff retries on
> rate limits, secure webhook verification via timing-safe token comparison, and a typed
> `types/` directory for first-class TypeScript support — all with zero runtime dependencies
> beyond `axios`.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Retry Configuration](#retry-configuration)
- [TypeScript Support](#typescript-support)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Testing](#testing)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

---

## Installation

```bash
npm install zalobot-sdk
```

Requires **Node.js >= 18.0.0**.

---

## Quick Start

### 1. Create a `.env` file

```env
ZALO_BOT_TOKEN=your_bot_token_here
ZALO_BOT_SECRET=your_secret_token_here
```

### 2. Create and run a bot server

```js
require('dotenv').config();
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN,
  secretKey: process.env.ZALO_BOT_SECRET,
});

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    if (event.event === 'user_text') {
      await bot.message.sendText(event.chatId, `You said: "${event.message.text}"`);
    }
  },
}));

app.listen(3000, () => console.log('Bot server running on port 3000'));
```

### 3. Register the webhook

```js
await bot.message.setWebhook('https://your-domain.com/webhook', process.env.ZALO_BOT_SECRET);
```

### 4. Send messages proactively

```js
await bot.message.sendText('user_chat_id', 'Hello from Zalo Bot!');
await bot.message.sendPhoto('user_chat_id', 'https://example.com/photo.jpg', { caption: 'Nice!' });
await bot.message.sendSticker('user_chat_id', 'sticker-id');
await bot.message.sendVoice('user_id', 'https://example.com/voice.aac'); // 1-1 chats only
```

---

## API Reference

### `bot.message` — MessageModule

| Method | Description |
|--------|-------------|
| `sendText(chatId, text, options?)` | Send a text message (1–2000 chars) |
| `sendPhoto(chatId, photoUrl, options?)` | Send a photo with optional caption |
| `sendSticker(chatId, stickerId)` | Send a sticker |
| `sendVoice(chatId, voiceUrl)` | Send a voice message (1-1 chats) |
| `sendChatAction(chatId, action)` | Send typing/uploading indicator |
| `getMe()` | Get bot info (`id`, `account_name`, `account_type`) |
| `getUpdates(options?)` | Long-polling updates (no webhook) |
| `setWebhook(url, secretToken)` | Register a webhook URL |
| `testWebhook()` | Test the current webhook endpoint |
| `deleteWebhook()` | Remove webhook configuration |
| `getWebhookInfo()` | Get current webhook URL and metadata |

### `bot.user` — UserModule

| Method | Description |
|--------|-------------|
| `getProfile(userId, options?)` | Get user profile (name, avatar, etc.) |
| `getFollowers(params?)` | List OA followers with pagination |
| `isFollowing(userId)` | Check if a user follows the OA |
| `getProfileCached(userId, options?)` | Get profile with 5-min in-memory cache |
| `clearCache(userId?)` | Clear user cache (one user or all) |

### `bot.webhook` — WebhookModule

| Method | Description |
|--------|-------------|
| `verify(req)` | Verify `X-Bot-Api-Secret-Token` header (timing-safe) |
| `requireValid(req)` | Verify or throw `ZaloWebhookError` |
| `parseEvent(payload)` | Parse & normalize a webhook body into a structured event |
| `middleware(options?)` | Create Express middleware with `onEvent` handler |
| `handle(handler)` | Shorthand for `middleware({ onEvent: handler })` |

### `bot.media` — MediaModule

| Method | Description |
|--------|-------------|
| `uploadImage(file, options?)` | Upload an image (path or Buffer) |
| `uploadFile(file, options?)` | Upload a generic file (path or Buffer) |
| `getMediaUrl(attachmentId, options?)` | Resolve an attachment ID to a URL |
| `downloadMedia(attachmentId, savePath)` | Download media to a local file (SSRF-protected) |
| `MediaModule.isValidImage(path)` | Static — check if file extension is a valid image |
| `MediaModule.validateImage(path, limits?)` | Static — validate format + size (default 10 MB) |

---

## Error Handling

The SDK throws **8 typed error classes**, all extending `ZaloBotError`:

| Class | When | Key properties |
|-------|------|----------------|
| `ZaloBotError` | Base class for all SDK errors | `code`, `status`, `details` |
| `ZaloApiError` | API returns an error response | `code`, `status`, `details` |
| `ZaloAuthError` | Bot token is invalid or expired (HTTP 401) | `status` |
| `ZaloWebhookError` | Webhook secret verification fails | `status` |
| `ZaloRateLimitError` | Rate limit exceeded (HTTP 429) | `retryAfter` (seconds) |
| `ZaloValidationError` | Client-side input validation fails | `field` |
| `ZaloNetworkError` | Network request fails (DNS, connection refused) | `details` |
| `ZaloTimeoutError` | Request times out | `details.timeout` |

```js
const { ZaloBot, ZaloRateLimitError, ZaloAuthError } = require('zalobot-sdk');

try {
  await bot.message.sendText(chatId, 'Hello');
} catch (err) {
  if (err instanceof ZaloRateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfter}s`);
  } else if (err instanceof ZaloAuthError) {
    console.error('Check your bot token');
  } else {
    console.error(err.code, err.message);
  }
}
```

---

## Retry Configuration

The SDK retries requests that fail with **HTTP 429** using exponential backoff with jitter.
Non-retryable statuses (400, 401, 403, 404, 422) fail immediately.

```js
const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN,
  retry: {
    enabled: true,        // Enable/disable retries (default: true)
    maxRetries: 3,        // Maximum retry attempts (default: 3)
    baseDelay: 1000,      // Base delay in ms for backoff (default: 1000)
    maxDelay: 30000,      // Maximum delay cap in ms (default: 30000)
    jitter: true,         // Random jitter to avoid thundering herd (default: true)
  },
});
```

Delay formula: `min(max(retryAfter, baseDelay × 2^attempt + random(0, baseDelay)), maxDelay)`

The `Retry-After` header from the server is respected when present.

---

## TypeScript Support

Type declarations ship in the `types/` directory. The package entry in `package.json`:

```json
{ "types": "types/index.d.ts" }
```

Import types directly:

```ts
import { ZaloBot, ZaloApiError, ZaloRateLimitError } from 'zalobot-sdk';

const bot: ZaloBot = new ZaloBot({ botToken: '...' });
```

---

## Environment Variables

All options can also be passed directly to the `ZaloBot` constructor, which takes precedence.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZALO_BOT_TOKEN` | ✅ Yes | — | Bot token from Zalo Bot Console (e.g. `123456789:abc-xyz`) |
| `ZALO_BOT_SECRET` | ✅ Yes | — | Secret key for webhook verification (8–256 chars) |
| `ZALO_BOT_TIMEOUT` | No | `30000` | Request timeout in milliseconds |
| `ZALO_BOT_MAX_RETRIES` | No | `3` | Maximum retry attempts on rate limit |
| `ZALO_BOT_BASE_URL` | No | `https://bot-api.zaloplatforms.com` | Custom API base URL |

> **Note:** The SDK does **not** auto-load `.env` files. Call `require('dotenv').config()`
> yourself before instantiation, or use `ZaloBot.fromEnv()` after populating `process.env`.

---

## Security

- **Webhook verification** — Every incoming request is verified against the
  `X-Bot-Api-Secret-Token` header using `crypto.timingSafeEqual` to prevent timing attacks.
- **SSRF protection** — `bot.media.downloadMedia` blocks private/internal hostnames
  (localhost, `10.*`, `172.16–31.*`, `192.168.*`).
- **Secret leakage prevention** — `config.getConfig()` and `bot.getConfig()` exclude
  `secretKey` by default. Pass `{ includeSecrets: true }` only when explicitly needed.
- **Never commit secrets** — Add `.env` to your `.gitignore` and use environment-specific
  secret management in production.

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint
npm run lint

# Type-check source files
npm run check
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines. In short:

1. Fork the repo and create a feature branch
2. Commit using [Conventional Commits](https://conventionalcommits.org/) format
3. Add tests and JSDoc for new public methods
4. Ensure `npm run lint` and `npm test` pass
5. Open a Pull Request

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Hoang Khac Phuc
