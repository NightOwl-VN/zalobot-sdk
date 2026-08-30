# Error Codes

This document lists all possible error codes returned by the Zalo Bot API and their solutions.

---

## API Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `0` | Success | — |
| `-1` | Unknown system error | Try again later. Contact Zalo support if persists. |
| `-2` | Invalid parameters | Check request body format and required fields. |
| `-3` | Invalid or expired access token | Renew your access token in Zalo Developer Platform. |
| `-4` | App doesn't have permission for this feature | Check your OA's feature permissions. |
| `-5` | Invalid secret key or signature | Verify your secret key matches the one in Developer Platform. |
| `-6` | Zalo Bot account locked or disabled | Contact Zalo support. |
| `-7` | User blocked the bot or hasn't interacted | Ask the user to follow or interact with the bot first. |
| `-8` | File or media exceeds size limit | Compress files. Max size: 10MB for images, 20MB for files. |
| `-9` | Rate limit exceeded | Slow down requests. Max: 30 requests/minute per access token. |
| `-10` | Unsupported request or endpoint not found | Check the API endpoint URL. |
| `-11` | User not found | Verify the user ID is correct. |
| `-12` | Request timeout | Optimize your server response time. Use async processing. |
| `-13` | Error parsing outgoing content | Check message format (text, JSON structure). |

---

## HTTP Status Codes

| Status | Description | Handling |
|--------|-------------|----------|
| `200` | Success | Proceed with normal flow. |
| `400` | Bad Request | Check request parameters and format. |
| `401` | Unauthorized | Renew access token. |
| `403` | Forbidden | Check OA permissions. |
| `404` | Not Found | Verify endpoint URL. |
| `429` | Too Many Requests | Wait and retry. SDK automatically retries up to 3 times. |
| `500` | Internal Server Error | Try again later. Contact Zalo if persistent. |

---

## Handling Errors in Code

```javascript
const { ZaloApiError, ZaloAuthError, ZaloRateLimitError } = require('zalobot-sdk');

try {
  await bot.message.sendText('invalid_user', 'Hello');
} catch (error) {
  if (error instanceof ZaloAuthError) {
    console.error('Authentication failed:', error.message);
    // Refresh token or prompt user to re-authenticate
  } else if (error instanceof ZaloRateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
    // Wait and retry
  } else if (error instanceof ZaloApiError) {
    console.error(`API Error ${error.code}:`, error.message);
    // Handle specific error code
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Common Error Scenarios

### 1. Rate Limit Exceeded (`-9`)

**Cause:** Sending too many requests in a short time.

**Solution:**
- Use the SDK's built-in retry logic (enabled by default)
- Add delays between requests
- Batch messages when possible

```javascript
// SDK automatically retries on 429 with exponential backoff
const bot = new ZaloBot({
  maxRetries: 5,  // Increase retry attempts
});
```

### 2. Invalid Access Token (`-3`)

**Cause:** Token expired or revoked.

**Solution:**
- Generate a new token in Zalo Developer Platform
- Use environment variables to avoid hardcoding
- Set up token refresh if using long-lived tokens

### 3. User Not Found (`-11`)

**Cause:** User ID is incorrect or user hasn't interacted with the bot.

**Solution:**
- Verify the user ID from webhook events
- Ensure the user has followed the OA
- Use valid test user IDs from Zalo Developer Platform

### 4. Webhook Signature Invalid (`401`)

**Cause:** Secret key mismatch or body tampered.

**Solution:**
- Verify the secret key in `.env` matches the one in Developer Platform
- Ensure you're passing the raw request body (not parsed JSON)
- Check that you're using the correct header name (`X-Zalo-Signature`)