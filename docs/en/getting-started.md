# Getting Started

This guide will walk you through creating a Zalo bot, setting up the SDK, and deploying it to production.

---

## Step 1: Create a Zalo Bot

1. Go to the [Zalo Developer Platform](https://developers.zalo.me/)
2. Log in with your Zalo account
3. Click **"Create Official Account"**
4. Fill in your bot's name, category, and other required fields
5. After creation, go to the **"Management"** tab
6. In the **"Access Token"** section, copy your **Access Token** and **Secret Key**

> ⚠️ **Important:** Save these credentials securely. The Access Token is used for API authentication, and the Secret Key is required for webhook signature verification.

---

## Step 2: Install the SDK

```bash
npm install zalobot-sdk
# or
yarn add zalobot-sdk
```

---

## Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```env
ZALO_BOT_ACCESS_TOKEN=your_access_token_here
ZALO_BOT_SECRET_KEY=your_secret_key_here
ZALO_BOT_APP_ID=your_app_id_here  # optional
ZALO_BOT_TIMEOUT=30000             # optional
ZALO_BOT_MAX_RETRIES=3             # optional
```

---

## Step 4: Write Your First Bot

Create a `index.js` file:

```javascript
const { ZaloBot } = require('zalobot-sdk');

// Initialize bot — automatically reads from .env
const bot = new ZaloBot();

// Send a test message
await bot.message.sendText('USER_ID', 'Hello from Zalo Bot!');
```

---

## Step 5: Handle Webhooks (Express.js)

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot(); // Uses .env

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    if (event.event === 'user_text') {
      await bot.message.sendText(event.userId, `You said: ${event.message.text}`);
    }
  }
}));

app.listen(3000, () => console.log('Bot is running on port 3000'));
```

---

## Step 6: Test Locally with Tunneling

For local testing, expose your webhook endpoint using:

**Using ngrok:**
```bash
ngrok http 3000
# Copy the HTTPS URL and set it in Zalo Developer Platform → Webhook
```

**Using Cloudflare Tunnel:**
```bash
cloudflared tunnel --url http://localhost:3000
```

Set the generated URL as your webhook endpoint in the Zalo Developer Platform.

---

## Step 7: Deploy to Production

### Option A: Deploy on Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Set environment variables
4. Deploy

### Option B: Deploy on Railway

1. Push your code to GitHub
2. Create a new project on Railway
3. Add environment variables
4. Deploy

### Option C: Deploy on a VPS

```bash
# Clone repository
git clone your-repo
cd your-repo

# Install dependencies
npm install

# Start with PM2 (production process manager)
npm install -g pm2
pm2 start index.js --name zalobot
pm2 save
pm2 startup
```

Configure Nginx as a reverse proxy (optional).

---

## Next Steps

- Check the [API Reference](./api-reference.md) for all available methods
- Learn about [Webhook Events](./webhook-events.md) to handle user interactions
- Review [Error Codes](./error-codes.md) for troubleshooting