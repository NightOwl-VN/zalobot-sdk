# Webhook Events

This document covers webhook setup, token verification, and how to handle incoming events.

---

## Setting Up a Webhook

1. Go to [Zalo Bot Platform](https://bot.zapps.me/)
2. Select your bot
3. Navigate to **"Webhook"** in the sidebar
4. Enter your webhook URL (must be HTTPS)
5. Copy the **Secret Key** — you'll need it to configure `secretKey` in the SDK

> ⚠️ **Important:** Your webhook must respond with `200 OK` within **5 seconds** to acknowledge receipt. Zalo will retry up to 3 times if it doesn't receive a response.

---

## Token Verification

Zalo Bot sends the secret token in the `X-Bot-Api-Secret-Token` header with every webhook request. The SDK compares it using a timing-safe comparison to prevent timing attacks.

### Using the Built-in Middleware

The middleware handles verification automatically — invalid requests are rejected with `403 Forbidden`:

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot(); // secretKey loaded from .env

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event, req, res) {
    // This handler only runs AFTER token verification passes.
    // Invalid tokens receive a 403 response automatically.
    console.log('Received event:', event);
  }
}));
```

The `onEvent` callback receives three arguments: the parsed `event` object, the raw `req` (Express request), and `res` (Express response).

#### Acknowledging Immediately

If you need to acknowledge Zalo's request before processing (e.g. to stay within the 5-second window), enable `acknowledgeImmediately`:

```javascript
app.post('/webhook', bot.webhook.middleware({
  acknowledgeImmediately: true, // sends 200 OK before running handler
  async onEvent(event, req, res) {
    // This runs after the response has already been sent
    await queue.add('process-event', event);
  }
}));
```

### Standalone Verification

For non-Express frameworks or custom routing, use `bot.webhook.verify(req)` directly. It checks the `X-Bot-Api-Secret-Token` header against the configured `secretKey` and returns a boolean:

```javascript
const { ZaloBot } = require('zalobot-sdk');

const bot = new ZaloBot();

function handleWebhook(req, res) {
  if (!bot.webhook.verify(req)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const event = bot.webhook.parseEvent(req.body);
  // ... handle event
}
```

### Convenience Handler

For simple bots, `bot.webhook.handle(fn)` is a shorthand for `bot.webhook.middleware({ onEvent: fn })`:

```javascript
app.post('/webhook', bot.webhook.handle(async (event) => {
  if (event.event === 'user_text') {
    await bot.message.sendText(event.userId, event.message.text);
  }
}));
```

---

## Event Payload Format

Zalo Bot sends a **wrapped** payload. The SDK's `parseEvent()` method accepts both wrapped and flat formats:

### Wrapped (standard from Zalo)

```json
{
  "ok": true,
  "result": {
    "event_name": "message.text.received",
    "message": {
      "message_id": "msg_xyz",
      "date": 1623456789,
      "from": { "id": "123456789" },
      "chat": { "id": "123456789" },
      "text": "Hello bot!"
    }
  }
}
```

### Flat (also accepted by parseEvent)

```json
{
  "event_name": "message.text.received",
  "message": {
    "message_id": "msg_xyz",
    "date": 1623456789,
    "from": { "id": "123456789" },
    "chat": { "id": "123456789" },
    "text": "Hello bot!"
  }
}
```

### Normalized SDK Event Object

After parsing, the event object is normalized to a consistent structure:

```javascript
{
  event: 'user_text',          // normalized short name
  eventName: 'message.text.received', // original Zalo event name
  userId: '123456789',         // from message.from.id
  chatId: '123456789',         // from message.chat.id (falls back to userId)
  messageId: 'msg_xyz',        // from message.message_id (or null)
  timestamp: 1623456789,       // from message.date (or Date.now())
  message: { text: 'Hello bot!' }, // event-specific payload
  raw: { ... }                 // original unwrapped payload
}
```

---

## Event Types

### `user_text`

Triggered when a user sends a text message. The raw event name is `message.text.received`.

**Normalized message object:** `{ text: string }`

```javascript
if (event.event === 'user_text') {
  const reply = `You said: ${event.message.text}`;
  await bot.message.sendText(event.userId, reply);
}
```

---

### `user_image`

Triggered when a user sends an image. The raw event name is `message.image.received`.

**Normalized message object:** `{ photo: object, caption: string | null }`

```javascript
if (event.event === 'user_image') {
  console.log('Image received:', event.message.photo);
  if (event.message.caption) {
    console.log('Caption:', event.message.caption);
  }
}
```

---

### `user_sticker`

Triggered when a user sends a sticker. The raw event name is `message.sticker.received`.

**Normalized message object:** `{ sticker: object }`

```javascript
if (event.event === 'user_sticker') {
  console.log('Sticker:', event.message.sticker);
}
```

---

### `user_voice`

Triggered when a user sends a voice message. The raw event name is `message.voice.received`.

**Normalized message object:** `{ voiceUrl: string | null }`

```javascript
if (event.event === 'user_voice') {
  const audioUrl = event.message.voiceUrl;
  // Process the voice message
}
```

---

### `user_unsupported`

Triggered when a user sends an unsupported message type. The raw event name is `message.unsupported.received`.

**Normalized message object:** the raw message as-is.

```javascript
if (event.event === 'user_unsupported') {
  await bot.message.sendText(event.userId, 'Sorry, this message type is not supported yet.');
}
```

---

### `user_follow`

Triggered when a user follows (subscribes to) the OA. The raw event name is `user.follow`.

```javascript
if (event.event === 'user_follow') {
  await bot.message.sendText(event.userId, 'Thanks for following! 🎉');
}
```

---

### `user_unfollow`

Triggered when a user unfollows the OA. The raw event name is `user.unfollow`.

```javascript
if (event.event === 'user_unfollow') {
  // User unsubscribed — cleanup session data if needed
  console.log('User unfollowed:', event.userId);
}
```

### Event Name Reference

| Normalized Event | Raw Zalo Event | Description |
|---|---|---|
| `user_text` | `message.text.received` | Text message received |
| `user_image` | `message.image.received` | Image message received |
| `user_sticker` | `message.sticker.received` | Sticker message received |
| `user_voice` | `message.voice.received` | Voice message received |
| `user_unsupported` | `message.unsupported.received` | Unsupported message type |
| `user_follow` | `user.follow` | User followed the OA |
| `user_unfollow` | `user.unfollow` | User unfollowed the OA |

> **Note:** The `event` field on the parsed event object is always the normalized short name. The original raw name is available in `event.eventName`.

---

## Error Handling

### Webhook Verification Errors

When the secret token is missing or invalid, the middleware responds with `403 Forbidden`. For standalone verification, `bot.webhook.verify(req)` returns `false` — always check it before parsing.

### Malformed Payload Errors

If the incoming body is missing `event_name` or `message.from.id`, the middleware returns an error status (`400`) with a descriptive message. In standalone mode, `parseEvent()` throws a `ZaloWebhookError`:

```javascript
const { ZaloBot, ZaloWebhookError } = require('zalobot-sdk');

const bot = new ZaloBot();

function handleWebhook(req, res) {
  // 1. Verify token
  if (!bot.webhook.verify(req)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  // 2. Parse event
  let event;
  try {
    event = bot.webhook.parseEvent(req.body);
  } catch (error) {
    if (error instanceof ZaloWebhookError) {
      return res.status(error.status || 400).json({ message: error.message });
    }
    throw error; // re-throw unexpected errors
  }

  // 3. Handle event
  processEvent(event);
  return res.status(200).json({ message: 'Success' });
}
```

### Handler Errors

Always catch errors inside `onEvent` handlers. The middleware logs handler errors to the console but does **not** crash the process. If your handler throws, the middleware still sends `200 OK` (if it hasn't already) to prevent Zalo from retrying:

```javascript
app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    try {
      await processEvent(event);
    } catch (error) {
      console.error('[Webhook] Handler failed:', error.message);
      // Don't throw — middleware will still respond 200 to prevent retries
    }
  }
}));
```

---

## Best Practices

1. **Always verify the secret token** — Reject requests without a valid `X-Bot-Api-Secret-Token` header to prevent spoofed webhooks
2. **Respond within 5 seconds** — Use `acknowledgeImmediately: true` or offload work to a queue
3. **Handle all event types** — At minimum, log unknown events so you can identify new Zalo features
4. **Make handlers idempotent** — Zalo may send duplicate events; design your handlers to handle the same event multiple times safely
5. **Use the normalized event names** — Always match against `event.event` (e.g. `user_text`), not `event.eventName` (`message.text.received`), for forward compatibility
6. **Log events for debugging** — Include `event.event`, `event.userId`, and `event.messageId` in your logs
7. **Don't throw in handlers** — Uncaught exceptions in `onEvent` are logged but swallowed; throw only for truly unrecoverable errors

---

## Quick Reference

```javascript
const express = require('express');
const { ZaloBot } = require('zalobot-sdk');

const app = express();
app.use(express.json());

const bot = new ZaloBot();

app.post('/webhook', bot.webhook.middleware({
  async onEvent(event) {
    switch (event.event) {
      case 'user_text':
        await bot.message.sendText(event.userId, `Echo: ${event.message.text}`);
        break;
      case 'user_follow':
        await bot.message.sendText(event.userId, 'Welcome! 🎉');
        break;
      case 'user_unfollow':
        console.log('User left:', event.userId);
        break;
      case 'user_image':
        console.log('Image from', event.userId, ':', event.message.photo);
        break;
      case 'user_voice':
        console.log('Voice URL:', event.message.voiceUrl);
        break;
      default:
        console.log('Unhandled event:', event.event);
    }
  }
}));

app.listen(3000, () => console.log('Bot running on port 3000'));
```
