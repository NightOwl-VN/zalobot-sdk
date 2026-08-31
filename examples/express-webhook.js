/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Example: Express webhook server for Zalo Bot
 * 
 * Run: node examples/express-webhook.js
 * Endpoint: POST http://localhost:3000/webhook
 * 
 * Set this URL as your Zalo Bot webhook endpoint:
 * https://your-domain.com/webhook
 */

const express = require('express');
const { ZaloBot } = require('../src');

// Load from environment variables
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize bot
const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN || 'YOUR_BOT_TOKEN',
  secret: process.env.ZALO_BOT_SECRET || 'YOUR_SECRET',
});

// Simple webhook handler using middleware
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event, req) {
    console.log(`[${new Date().toISOString()}] Event: ${event.event} from ${event.userId}`);

    // Handle different event types
    switch (event.event) {
      case 'user_text':
        const text = event.message?.text || '';
        await handleTextMessage(event.chatId, text);
        break;

      case 'user_quick_reply':
        const payload = event.message?.quickReply?.payload || '';
        await handleQuickReply(event.chatId, payload);
        break;

      case 'user_follow':
        await bot.message.sendText(
          event.chatId,
          'Thanks for following! 🎉\nSend any message and I will reply!'
        );
        break;

      case 'user_unfollow':
        console.log(`User ${event.userId} unfollowed`);
        break;

      default:
        console.log(`Unhandled event: ${event.event}`);
    }
  }
}));

/**
 * Handle text messages with simple bot logic
 */
async function handleTextMessage(chatId, text) {
  const lowerText = text.toLowerCase().trim();

  if (lowerText === 'hi' || lowerText === 'hello') {
    await bot.message.sendText(chatId, 'Hi! How can I help you?');
    return;
  }

  if (lowerText.includes('help')) {
    await bot.message.sendQuickReply(chatId, 'I can help you with:', [
      { title: 'Info', payload: 'info' },
      { title: 'Support', payload: 'support' },
      { title: 'Contact', payload: 'contact' },
    ]);
    return;
  }

  // Default response
  await bot.message.sendText(chatId, `You sent: "${text}"`);
}

/**
 * Handle quick reply selections
 */
async function handleQuickReply(chatId, payload) {
  const responses = {
    info: '📋 Here is our information...',
    support: '🛠️ What do you need help with? Please describe in detail.',
    contact: '📞 Contact: contact@example.com',
  };

  const response = responses[payload] || `You selected: ${payload}`;
  await bot.message.sendText(chatId, response);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`🚀 Zalo Bot webhook server running on port ${PORT}`);
  console.log(`   Webhook URL: ${BASE_URL}/webhook`);
  console.log(`   Health check: ${BASE_URL}/health`);
  console.log('\n📌 Configure this Webhook URL in your Zalo Bot developer settings.');
});
