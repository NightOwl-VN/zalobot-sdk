/**
 * Example: Express webhook server for Zalo Bot
 * 
 * Run: node examples/express-webhook.js
 * Endpoint: POST http://localhost:3000/webhook
 * 
 * Set this URL as your Zalo webhook endpoint:
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
  accessToken: process.env.ZALO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
  secretKey: process.env.ZALO_SECRET_KEY || 'YOUR_SECRET_KEY',
});

// Simple webhook handler using middleware
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event, req) {
    console.log(`[${new Date().toISOString()}] Event: ${event.event} from ${event.userId}`);

    // Handle different event types
    switch (event.event) {
      case 'user_text':
        const text = event.message?.text || '';
        await handleTextMessage(event.userId, text);
        break;

      case 'user_quick_reply':
        const payload = event.message?.quickReply?.payload || '';
        await handleQuickReply(event.userId, payload);
        break;

      case 'user_follow':
        await bot.message.sendText(
          event.userId,
          'Cảm ơn bạn đã theo dõi! 🎉\nHãy gửi tin nhắn bất kỳ để tôi trả lời.'
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
async function handleTextMessage(userId, text) {
  const lowerText = text.toLowerCase().trim();

  if (lowerText === 'hi' || lowerText === 'hello' || lowerText === 'xin chào') {
    await bot.message.sendText(userId, 'Xin chào! Tôi có thể giúp gì cho bạn?');
    return;
  }

  if (lowerText.includes('help') || lowerText.includes('trợ giúp')) {
    await bot.message.sendQuickReply(userId, 'Tôi có thể giúp bạn:', [
      { title: 'Thông tin', payload: 'info' },
      { title: 'Hỗ trợ', payload: 'support' },
      { title: 'Liên hệ', payload: 'contact' },
    ]);
    return;
  }

  // Default response
  await bot.message.sendText(userId, `Bạn vừa gửi: "${text}"`);
}

/**
 * Handle quick reply selections
 */
async function handleQuickReply(userId, payload) {
  const responses = {
    info: '📋 Đây là thông tin về chúng tôi...',
    support: '🛠️ Bạn cần hỗ trợ gì? Vui lòng mô tả chi tiết.',
    contact: '📞 Liên hệ: contact@example.com',
  };

  const response = responses[payload] || `Bạn đã chọn: ${payload}`;
  await bot.message.sendText(userId, response);
}

// Health check endpoint
app.get('/health', (req, res) => {
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