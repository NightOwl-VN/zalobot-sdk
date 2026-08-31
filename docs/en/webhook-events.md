# Webhook Events

This document covers webhook setup, signature verification, and how to handle incoming events.

---

## Setting Up a Webhook

1. Go to [Zalo Bot Platform](https://bot.zapps.me/)
2. Select your bot
3. Navigate to **"Webhook"** in the sidebar
4. Enter your webhook URL (must be HTTPS)
5. Copy the **Secret Key** — you'll need it to verify signatures

> ⚠️ **Important:** Your webhook must respond with `200 OK` within **5 seconds** to acknowledge receipt. Zalo will retry up to 3 times if it doesn't receive a response.

---

## Signature Verification

Zalo Bot sends the secret token in the `X-Bot-Api-Secret-Token` header. The SDK handles verification automatically when you use the built-in middleware.

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot(); // Secret key loaded from .env

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    // If signature is invalid, middleware returns 401
    // Event is only passed after verification
    console.log('Received event:', event);
  }
}));
```

**Manual verification:**
```javascript
const isValid = bot.webhook.verifySignature(
  req.headers['x-zalo-signature'],
  JSON.stringify(req.body)
);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Event Types

### `user_text`

Triggered when a user sends a text message.

**Payload:**
```json
{
  "event_name": "user_text",
  "sender": { "id": "123456789" },
  "message_id": "msg_xyz",
  "message": { "text": "Hello bot!" },
  "timestamp": 1623456789
}
```

**SDK Event Object:**
```javascript
{
  event: 'user_text',
  userId: '123456789',
  messageId: 'msg_xyz',
  message: { text: 'Hello bot!' },
  timestamp: 1623456789,
  raw: { ... }
}
```

**Example handler:**
```javascript
if (event.event === 'user_text') {
  const reply = `You said: ${event.message.text}`;
  await bot.message.sendText(event.userId, reply);
}
```

---

### `user_quick_reply`

Triggered when a user clicks a quick reply button.

**Payload:**
```json
{
  "event_name": "user_quick_reply",
  "sender": { "id": "123456789" },
  "message_id": "msg_xyz",
  "message": {
    "text": "I choose this!",
    "quick_reply": { "payload": "option_a" }
  }
}
```

**SDK Event Object:**
```javascript
{
  event: 'user_quick_reply',
  userId: '123456789',
  messageId: 'msg_xyz',
  message: {
    text: 'I choose this!',
    quickReply: { payload: 'option_a' }
  }
}
```

---

### `user_follow`

Triggered when a user follows the OA.

**Payload:**
```json
{
  "event_name": "user_follow",
  "sender": { "id": "123456789" },
  "follow": { "action": "follow", "source": "qr_code" }
}
```

**Example:**
```javascript
if (event.event === 'user_follow') {
  await bot.message.sendText(event.userId, 'Thanks for following! 🎉');
}
```

---

### `user_unfollow`

Triggered when a user unfollows the OA.

**Payload:**
```json
{
  "event_name": "user_unfollow",
  "sender": { "id": "123456789" }
}
```

---

### `message_delivered`

Triggered when a message is delivered.

---

### `message_read`

Triggered when a message is read.

---

## Best Practices

1. **Always verify signatures** — Prevents spoofed requests
2. **Respond quickly** — 200 OK within 5 seconds
3. **Use async processing** — Offload heavy tasks to queues
4. **Log events** — For debugging and analytics
5. **Handle errors gracefully** — Don't throw exceptions in webhook handlers

**Async processing example:**
```javascript
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    // Offload to background queue
    await queue.add('process-event', event);
  }
}));
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `401 Invalid signature` | Check that `secretKey` matches the one in Zalo Bot Platform |
| `Webhook URL not reachable` | Ensure your server is public and uses HTTPS |
| `Timeout` | Respond with 200 OK immediately, process asynchronously |
| `Duplicate events` | Zalo may send duplicates — make your handlers idempotent |