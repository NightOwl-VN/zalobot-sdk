/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Example: Send various message types via Zalo Bot SDK
 * Reference: https://bot.zapps.me/docs/apis/sendMessage/
 */

const { ZaloBot } = require('../src');

const bot = new ZaloBot({
  botToken: process.env.ZALO_BOT_TOKEN || 'YOUR_BOT_TOKEN',
  secretKey: process.env.ZALO_BOT_SECRET || 'YOUR_SECRET',
});

// User ID for testing (replace with real ID)
const TEST_USER_ID = process.env.ZALO_BOT_TEST_USER_ID || 'user123456789';

// Demo: Send text message
async function sendText() {
  console.log('1️⃣ Send text message...');
  const result = await bot.message.sendText(TEST_USER_ID, 'Hello from Zalo Bot SDK!');
  console.log('   ✅ message_id:', result.message_id);
}

// Demo: Send image
async function sendImage() {
  console.log('2️⃣ Send image message...');
  const result = await bot.message.sendPhoto(TEST_USER_ID, 'https://example.com/image.jpg', {
    caption: 'Beautiful nature!'
  });
  console.log('   ✅ message_id:', result.message_id);
}

// Demo: Send sticker
async function sendSticker() {
  console.log('3️⃣ Send sticker message...');
  const result = await bot.message.sendSticker(TEST_USER_ID, 'sticker_id_abc123');
  console.log('   ✅ message_id:', result.message_id);
}

(async () => {
  await sendText();
  await sendImage();
  await sendSticker();
  console.log('✅ All demo messages sent successfully!');
})();
