# Zalo Bot SDK for Node.js

📚 **Documentation:** [English 🇺🇸](./docs/en/README.md) | [Tiếng Việt 🇻🇳](./docs/vi/README.md)

[![npm version](https://img.shields.io/npm/v/zalobot-sdk.svg)](https://www.npmjs.com/package/zalobot-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A lightweight, modular, and enterprise-ready Node.js SDK and Webhook handler for the [Zalo Bot Platform](https://bot.zapps.me/). Fully typed with JSDoc for rich IDE autocomplete, automatic retry handling on rate limits, and secure webhook verification via `X-Bot-Api-Secret-Token`.

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
- [Conventional Commits](#-conventional-commits)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

- ✅ **Full API Coverage**: Text, Image, File, Sticker, Voice, Chat Actions, Templates, and Quick Replies
- ✅ **Automatic Retries**: Built-in exponential backoff for HTTP `429 Too Many Requests` status codes
- ✅ **Secure Webhook**: Token verification via `X-Bot-Api-Secret-Token` header (timing-safe comparison)
- ✅ **Zero-Config with `.env`**: Out-of-the-box environment variable binding via `dotenv` (`ZALO_BOT_TOKEN`, `ZALO_BOT_SECRET`)
- ✅ **Modular Architecture**: Independent sub-modules with clean separation of concerns
- ✅ **Rich IntelliSense**: Comprehensive JSDoc annotations on every class, parameter, and method
- ✅ **Custom Error Hierarchy**: Categorized exceptions (`ZaloApiError`, `ZaloAuthError`, `ZaloRateLimitError`)
- ✅ **Conventional Commits**: Commit messages follow `type(scope)` format for changelog generation
- ✅ **Cross-platform**: Works on Node.js 18+, with types for TypeScript

---

## 📖 End-to-End Setup Guide

Follow this step-by-step guide to build, test, and deploy a production Zalo Bot from scratch.

### Step 1: Create a Zalo Bot

1. Open the [Zalo Bot Platform Console](https://bot.zapps.me/)
2. Log in with your Zalo account
3. Click **Create New Bot**
4. Fill in basic information:
   - **Bot Display Name**: Must start with prefix `Bot`, e.g. `Bot MyShop`
   - **Avatar & Cover Image**
   - **Category & Description**
5. Save your bot settings
6. After creation, the system will send your **Bot Token** and **Secret Key** via Zalo message

### Step 2: Retrieve API Credentials

1. In your bot dashboard, locate the **Settings** tab
2. Copy the following credentials:

| Credential | Description | Environment Variable |
|------------|-------------|---------------------|
| **Bot Token** (`ZALO_BOT_TOKEN`) | Used in API URL path: `https://bot-api.zaloplatforms.com/bot{BOT_TOKEN}/...` | `ZALO_BOT_TOKEN` |
| **Secret Key** (`ZALO_BOT_SECRET`) | Used to verify webhook requests via `X-Bot-Api-Secret-Token` header | `ZALO_BOT_SECRET` |

⚠️ **Important:** These secrets are confidential. Never commit them to version control or share publicly.

### Step 3: Installation & Configuration

Install the SDK in your Node.js project:

```bash
npm install zalobot-sdk
```

### Step 4: Local Testing & Webhook Setup

Since webhook URLs must be publicly accessible, use a tunnel service for local development:

| Service | Command | Notes |
|---------|---------|-------|
| [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/tutorials/local-tunnel/) | `cloudflared tunnel --url http://localhost:3000` | Recommended |
| [ngrok](https://ngrok.com/) | `ngrok http 3000` | Free tier available |
| [localtunnel](https://localhost.tunnel.com/) | `npx localtunnel --port 3000` | |

After tunnel is running, configure webhook:

```bash
# Set webhook URL
await bot.message.setWebhook('https://your-tunnel-url.com/webhook', 'your-secret-token');

// Test webhook
const result = await bot.message.testWebhook();
if (result.result.ok) {
  console.log('Webhook configured successfully!');
}
```

### Step 5: Deployment & Going to Production

1. Ensure your server has a valid HTTPS certificate
2. Configure webhook with your production domain
3. Set environment variables in your deployment environment
4. Monitor webhook logs for any errors
5. Set up error tracking and alerting

---

## 📦 Quick Start

```bash
# 1. Install SDK
npm install zalobot-sdk

# 2. Create .env file
cat > .env << 'EOF'
ZALO_BOT_TOKEN=your_bot_token_here
ZALO_BOT_SECRET=your_secret_token_here
PORT=3000
EOF

# 3. Create a simple bot server
cat > index.js << 'INDEXEOF'
require('dotenv').config();
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN,
  secretKey: process.env.ZALO_BOT_SECRET,
});

// Simple webhook handler
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    if (event.event === 'user_text') {
      await bot.message.sendText(event.chatId, `You said: "${event.message.text}"`);
    }
  }
}));

app.listen(3000, () => {
  console.log('🚀 Zalo Bot server running at http://localhost:3000');
  console.log('🌐 Webhook URL: https://your-domain.com/webhook');
});
INDEXEOF

# 4. Run
node index.js
```

### Step 5: Send Your First Message

```javascript
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN,
  secretKey: process.env.ZALO_BOT_SECRET,
});

// Send text message
await bot.message.sendText('user_chat_id', 'Hello! Bot is working!');

// Send image
await bot.message.sendPhoto('user_chat_id', 'https://example.com/image.jpg', {
  caption: 'Beautiful nature'
});

// Send sticker
await bot.message.sendSticker('user_chat_id', 'sticker-id-from-zaloapp-com');

// Send voice (1-1 only)
await bot.message.sendVoice('user_id', 'https://example.com/voice.aac');
```

---

## 🔧 API Reference

- [Message Module](./docs/en/README.md#message-module-botmessage)
- [User Module](./docs/en/README.md#user-module-botuser)
- [Webhook Module](./docs/en/README.md#webhook-module-botwebhook)
- [Media Module](./docs/en/README.md#media-module-botmedia)

---

## 🗂️ Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ZALO_BOT_TOKEN` | ✅ Yes | Bot Token from Zalo Bot Console | `123456789:abc-xyz` |
| `ZALO_BOT_SECRET` | ✅ Yes | Secret key for webhook verification | `my-secret-8-chars-min` |
| `PORT` | No | Server port (default: 3000) | `3000` |

⚠️ **Note:** The secret key must be 8-256 characters and must match the secret configured via `setWebhook()` on the Zalo Bot Platform.

---

## 📜 Conventional Commits

All commit messages **must** follow the [Conventional Commits](https://conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]

Type options:
- feat:     A new feature
- fix:      A bug fix
- docs:     Documentation changes
- style:    Code format changes (missing semicolons, formatting)
- refactor: Code refactoring
- test:     Adding or correcting tests
- chore:    Routine tasks

Example:
git commit -m "feat(message): add sendVoice method"
git commit -m "fix(webhook): fix timing-safe-equal length check"
git commit -m "docs(api): update sendMessage parameter description"
git commit -m "refactor(client): use botToken in URL instead of header"
```

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/foo-bar`
3. Commit your changes following the [Conventional Commits](https://conventionalcommits.org/) format
4. Push to the branch: `git push origin feature/foo-bar`
5. Open a Pull Request

**Development Guidelines:**

- Add JSDoc annotations for all new public methods
- Add unit tests for new functionality
- Run `npm run lint` before committing
- Ensure all tests pass: `npm test`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 Hoang Khac Phuc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
