# Zalo Bot SDK for Node.js

📚 **Documentation:** [English 🇺🇸](./docs/en/README.md) | [Tiếng Việt 🇻🇳](./docs/vi/README.md)

---

[![npm version](https://img.shields.io/npm/v/zalobot-sdk.svg)](https://www.npmjs.com/package/zalobot-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A lightweight, modular, and enterprise-ready Node.js SDK and Webhook handler for the [Zalo Bot Platform](https://bot.zapps.me/). Fully typed with JSDoc for rich IDE autocomplete, automatic retry handling on rate limits, and secure cryptographic webhook signature verification.

---

## 📑 Table of Contents

- [Features](#-features)
- [End-to-End Setup Guide](#-end-to-end-setup-guide)
  - [Step 1: Create a Zalo Bot](#step-1-create-a-zalo-bot)
  - [Step 2: Retrieve API Credentials](#step-2-retrieve-api-credentials)
  - [Step 3: Installation & Configuration](#step-3-installation--configuration)
  - [Step 4: Local Testing & Webhook Setup](#step-4-local-testing--webhook-setup)
  - [Step 5: Deployment & Going to Production](#step-5-deployment--going-to-production)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
  - [Message Module](#message-module-botmessage)
  - [User Module](#user-module-botuser)
  - [Webhook Module](#webhook-module-botwebhook)
  - [Media Module](#media-module-botmedia)
- [Error Handling](#-error-handling)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

- ✅ **Full API Coverage**: Text, Image, File, Sticker, Interactive Button Templates, and Quick Replies.
- ✅ **Automatic Retries**: Built-in exponential backoff for HTTP `429 Too Many Requests` status codes.
- ✅ **Cryptographic Security**: Timing-safe HMAC-SHA256 signature verification for incoming webhooks.
- ✅ **Zero-Config with `.env`**: Out-of-the-box environment variable binding via `dotenv`.
- ✅ **Modular Architecture**: Independent sub-modules with clean separation of concerns.
- ✅ **Rich IntelliSense**: Comprehensive JSDoc annotations on every class, parameter, and method.
- ✅ **Custom Error Hierarchy**: Categorized exceptions (`ZaloApiError`, `ZaloAuthError`, `ZaloValidationError`).

---

## 📖 End-to-End Setup Guide

Follow this step-by-step guide to build, test, and deploy a production Zalo Bot from scratch.

### Step 1: Create a Zalo Bot
1. Navigate to the [Zalo Developer Portal](https://developers.zalo.me/) or [Zalo Bot Platform Console](https://bot.zapps.me/).
2. Log in with your Zalo account and navigate to **My Apps / Bot Console**.
3. Click **Create New Bot** (or link an existing Zalo Official Account).
4. Fill in basic information:
   - **Bot Display Name**
   - **Avatar & Cover Image**
   - **Category & Description**
5. Save your application settings.

---

### Step 2: Retrieve API Credentials
1. In your bot dashboard, locate the **Settings** or **App Secret** tab.
2. Copy the following credentials:
   - **Access Token** (`ZALO_BOT_ACCESS_TOKEN`): The bearer token used to authenticate API requests.
   - **Secret Key** (`ZALO_BOT_SECRET_KEY`): Used to verify the HMAC-SHA256 signature sent with every webhook event.
   - **App ID** (`ZALO_BOT_APP_ID`): Your application unique identifier.
3. Keep these secrets confidential. Never commit them to version control.

---

### Step 3: Installation & Configuration

Install the SDK in your Node.js project:

```bash
npm install zalobot-sdk
# or
yarn add zalobot-sdk
# or
pnpm add zalobot-sdk
```

Create a `.env` file in the root of your project:

```env
# .env
ZALO_BOT_ACCESS_TOKEN=your_actual_access_token_here
ZALO_BOT_SECRET_KEY=your_actual_secret_key_here
PORT=3000
BASE_URL=https://your-domain.com
```

---

### Step 4: Local Testing & Webhook Setup

Create an entry file `server.js` (or use the built-in example in `examples/express-webhook.js`):

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

// Initialize SDK (automatically loads credentials from process.env)
const bot = new ZaloBot();

// Register the webhook endpoint
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    console.log(`[Event: ${event.event}] from User: ${event.userId}`);

    if (event.event === 'user_text') {
      const userMessage = event.message?.text || '';
      // Echo the message back to the sender
      await bot.message.sendText(event.userId, `Bot received: "${userMessage}"`);
    }
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zalo Bot webhook listening on port ${PORT}`);
});
```

#### Expose Local Server via Cloudflare Tunnels or Ngrok
Zalo requires a public HTTPS URL to deliver webhook events. Expose port 3000:

**Option A — Using Cloudflare Tunnels (Recommended):**
```bash
cloudflared tunnel --url http://localhost:3000
```

**Option B — Using Ngrok:**
```bash
ngrok http 3000
```

Copy the generated HTTPS URL (e.g., `https://random-subdomain.ngrok-free.app`) and append `/webhook`:
`https://random-subdomain.ngrok-free.app/webhook`

Go to your **Zalo Bot Dashboard → Webhook Settings**, paste the URL, set your Secret Key, and click **Verify & Save**.

---

### Step 5: Deployment & Going to Production

When you are ready to publish your bot, deploy your server to any cloud or container platform.

#### Deploying on Render / Railway / Fly.io / VPS
1. **Repository Setup**: Push your application to a private GitHub repository.
2. **Environment Variables**: In your cloud platform dashboard, add:
   - `ZALO_BOT_ACCESS_TOKEN` = `<your_production_token>`
   - `ZALO_BOT_SECRET_KEY` = `<your_production_secret>`
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
3. **Build & Start Commands**:
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Update Webhook URL**: Once deployed, update the Webhook URL in your Zalo Developer Console to point to your live domain:
   `https://bot.yourcompany.com/webhook`
5. **Switch to Active/Live**: Switch your Bot mode to **Active** / **Production** in the Zalo Developer Portal.

---

## ⚡ Quick Start

### 1. Zero-Config Initialization (via `.env`)
```javascript
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot();
```

### 2. Explicit Configuration
```javascript
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot({
  accessToken: 'YOUR_ZALO_BOT_ACCESS_TOKEN',
  secretKey: 'YOUR_ZALO_BOT_SECRET_KEY',
  timeout: 15000,
  maxRetries: 3
});
```

### 3. Sending Messages
```javascript
// Plain Text
await bot.message.sendText('USER_ID', 'Hello from Zalo Bot SDK!');

// Quick Reply Buttons
await bot.message.sendQuickReply('USER_ID', 'Please select an option:', [
  { title: 'Customer Support', payload: 'ACTION_SUPPORT' },
  { title: 'Billing Inquiry', payload: 'ACTION_BILLING' }
]);

// Interactive Buttons / Templates
await bot.message.sendTemplate('USER_ID', {
  type: 'button',
  elements: [
    { title: 'Documentation', url: 'https://github.com/NightOwl-VN/zalobot-sdk' },
    { title: 'Contact Us', payload: 'ACTION_CONTACT' }
  ]
});
```

---

## 📚 API Reference

### Message Module (`bot.message`)

| Method | Parameters | Description |
|---|---|---|
| `sendText(userId, text, options)` | `userId: string`, `text: string`, `options?: Object` | Sends a plain text message. |
| `sendImage(userId, attachmentId, options)` | `userId: string`, `attachmentId: string`, `options?: Object` | Sends an image message using an uploaded attachment ID. |
| `sendFile(userId, attachmentId, options)` | `userId: string`, `attachmentId: string`, `options?: Object` | Sends a file attachment. |
| `sendSticker(userId, stickerId, options)` | `userId: string`, `stickerId: string`, `options?: Object` | Sends a sticker from the Zalo sticker catalog. |
| `sendTemplate(userId, template, options)` | `userId: string`, `template: Object`, `options?: Object` | Sends action button templates or list cards. |
| `sendQuickReply(userId, text, replies, options)` | `userId: string`, `text: string`, `replies: Array`, `options?: Object` | Sends text with quick reply option pills. |
| `getMessage(messageId)` | `messageId: string` | Retrieves message delivery metadata. |
| `getConversation(params)` | `params?: { userId, limit, cursor }` | Retrieves conversation history. |

### User Module (`bot.user`)

| Method | Parameters | Description |
|---|---|---|
| `getProfile(userId, options)` | `userId: string`, `options?: { fields }` | Fetches a subscriber's public profile data. |
| `getFollowers(params)` | `params?: { limit, cursor, fields }` | Retrieves a paginated list of followers. |
| `isFollowing(userId)` | `userId: string` | Checks if a user is currently following the bot. |
| `getProfileCached(userId, options)` | `userId: string`, `options?: { forceRefresh }` | Retrieves profile with built-in in-memory caching. |

### Webhook Module (`bot.webhook`)

| Method | Parameters | Description |
|---|---|---|
| `verifySignature(signature, rawBody, secretKey?)` | `signature: string`, `rawBody: string`, `secretKey?: string` | Performs timing-safe HMAC-SHA256 signature verification. |
| `parseEvent(payload)` | `payload: Object` | Normalizes incoming webhook events into standard data structures. |
| `middleware(options)` | `options?: { secretKey, verifySignature, onEvent }` | Express.js middleware for automated signature check and handling. |
| `handle(handler, options?)` | `handler: Function`, `options?: Object` | Standalone handler function for custom routing frameworks. |

### Media Module (`bot.media`)

| Method | Parameters | Description |
|---|---|---|
| `uploadImage(file, options)` | `file: string \| Buffer`, `options?: Object` | Uploads an image file (`multipart/form-data`) to Zalo storage. |
| `uploadFile(file, options)` | `file: string \| Buffer`, `options?: Object` | Uploads a general document or media file. |
| `getMediaUrl(attachmentId, options)` | `attachmentId: string`, `options?: { redirect }` | Resolves public temporary URL for an attachment ID. |
| `downloadMedia(attachmentId, savePath)` | `attachmentId: string`, `savePath: string` | Streams and writes media from Zalo servers to a local path. |

---

## 🛡️ Error Handling

The SDK exposes custom error classes mapped to Zalo platform response codes:

```javascript
const { ZaloBot, ZaloApiError, ZaloAuthError, ZaloValidationError } = require('zalobot-sdk');

const bot = new ZaloBot();

try {
  await bot.message.sendText('INVALID_USER_ID', 'Test message');
} catch (error) {
  if (error instanceof ZaloAuthError) {
    console.error('Authentication Error: Invalid or expired Access Token');
  } else if (error instanceof ZaloApiError) {
    console.error(`Zalo API Error [${error.code}]:`, error.message);
  } else if (error instanceof ZaloValidationError) {
    console.error('Validation Error:', error.message);
  } else {
    console.error('Unexpected Error:', error);
  }
}
```

---

## ⚙️ Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `ZALO_BOT_ACCESS_TOKEN` | `string` | *Required* | Bearer Access Token from Zalo Bot Portal |
| `ZALO_BOT_SECRET_KEY` | `string` | `null` | Webhook verification Secret Key |
| `ZALO_BOT_APP_ID` | `string` | `null` | Zalo Application ID |
| `ZALO_BOT_TIMEOUT` | `number` | `30000` | HTTP request timeout in milliseconds |
| `ZALO_BOT_MAX_RETRIES` | `number` | `3` | Maximum retry attempts upon receiving HTTP 429 |
| `ZALO_BOT_BASE_URL` | `string` | `https://graph.zalo.me/v2.0` | Base API URL |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for pull request guidelines, coding standards, and issue reporting.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [NightOwl VN](https://github.com/NightOwl-VN).
