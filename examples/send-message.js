/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Example: Send various types of messages using Zalo Bot SDK
 * 
 * Run: node examples/send-message.js
 */

const { ZaloBot } = require('../src');
require('dotenv').config();

// Initialize bot
const bot = new ZaloBot({
  accessToken: process.env.ZALO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
  secretKey: process.env.ZALO_SECRET_KEY || 'YOUR_SECRET_KEY',
});

// Replace with actual user ID
const USER_ID = process.env.ZALO_TEST_USER_ID || 'USER_ID_HERE';

async function main() {
  try {
    console.log('🚀 Starting Zalo Bot examples...\n');

    // 1. Send a text message
    console.log('📝 Sending text message...');
    await bot.message.sendText(USER_ID, 'Hello from Zalo Bot SDK! 👋');
    console.log('✅ Text message sent\n');

    // 2. Send a message with quick replies
    console.log('📝 Sending quick reply message...');
    await bot.message.sendQuickReply(
      USER_ID,
      'Chọn một tùy chọn:',
      [
        { title: 'Thông tin', payload: 'info' },
        { title: 'Hỗ trợ', payload: 'support' },
        { title: 'Liên hệ', payload: 'contact' },
      ]
    );
    console.log('✅ Quick reply sent\n');

    // 3. Get user profile
    console.log('👤 Getting user profile...');
    const user = await bot.user.getProfile(USER_ID);
    console.log(`   User: ${user.name || 'N/A'}`);
    console.log(`   Avatar: ${user.avatar || 'N/A'}`);
    console.log(`   ID: ${user.id}`);
    console.log('✅ Profile fetched\n');

    // 4. Send a template message (buttons)
    console.log('📝 Sending template message...');
    await bot.message.sendTemplate(USER_ID, {
      type: 'button',
      elements: [
        { title: 'Website', payload: 'website' },
        { title: 'GitHub', payload: 'github' },
        { title: 'Docs', payload: 'docs' },
      ],
    });
    console.log('✅ Template sent\n');

    // 5. Get conversation history
    console.log('📜 Getting conversation history...');
    const history = await bot.message.getConversation({
      userId: USER_ID,
      limit: 5,
    });
    console.log(`   Found ${history.data?.length || 0} messages`);
    if (history.data && history.data.length > 0) {
      history.data.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.message?.text || '[non-text]'}`);
      });
    }
    console.log('✅ History fetched\n');

    console.log('✨ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run with error handling
main().catch(console.error);