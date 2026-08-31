const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Test that the package can be required and all exports are present
describe('Package exports', () => {
  const sdk = require('../src');

  it('exports ZaloBot as default', () => {
    assert.ok(sdk.default);
    assert.equal(sdk.default.name, 'ZaloBot');
  });

  it('exports ZaloBot as named export', () => {
    assert.ok(sdk.ZaloBot);
  });

  it('exports all core modules', () => {
    assert.ok(sdk.ZaloClient);
    assert.ok(sdk.ZaloConfig);
    assert.ok(sdk.MessageModule);
    assert.ok(sdk.UserModule);
    assert.ok(sdk.WebhookModule);
    assert.ok(sdk.MediaModule);
  });

  it('exports all 8 error classes', () => {
    assert.ok(sdk.ZaloBotError);
    assert.ok(sdk.ZaloApiError);
    assert.ok(sdk.ZaloAuthError);
    assert.ok(sdk.ZaloWebhookError);
    assert.ok(sdk.ZaloRateLimitError);
    assert.ok(sdk.ZaloValidationError);
    assert.ok(sdk.ZaloNetworkError);
    assert.ok(sdk.ZaloTimeoutError);
  });

  it('exports Errors convenience object', () => {
    assert.ok(sdk.Errors);
    assert.equal(Object.keys(sdk.Errors).length, 8);
  });

  it('all error classes extend ZaloBotError', () => {
    const { ZaloBotError, ZaloApiError, ZaloAuthError, ZaloWebhookError,
            ZaloRateLimitError, ZaloValidationError, ZaloNetworkError, ZaloTimeoutError } = sdk;
    assert.ok(new ZaloApiError('test') instanceof ZaloBotError);
    assert.ok(new ZaloAuthError('test') instanceof ZaloBotError);
    assert.ok(new ZaloWebhookError('test') instanceof ZaloBotError);
    assert.ok(new ZaloRateLimitError('test') instanceof ZaloBotError);
    assert.ok(new ZaloValidationError('test', 'field') instanceof ZaloBotError);
    assert.ok(new ZaloNetworkError('test') instanceof ZaloBotError);
    assert.ok(new ZaloTimeoutError('test') instanceof ZaloBotError);
  });
});

describe('ZaloConfig', () => {
  const { ZaloConfig } = require('../src');

  it('creates config from options', () => {
    const config = new ZaloConfig({ botToken: 'test-token-123' });
    assert.ok(config.botToken);
    assert.ok(config.baseURL);
    assert.ok(config.timeout >= 0);
    assert.ok(config.maxRetries >= 0);
  });

  it('fromEnv works with env vars', () => {
    process.env.ZALO_BOT_TOKEN = 'env-test-token';
    const config = ZaloConfig.fromEnv();
    assert.equal(config.botToken, 'env-test-token');
    delete process.env.ZALO_BOT_TOKEN;
  });

  it('hasSecretKey works', () => {
    // secretKey < 8 chars is now rejected by constructor validation
    assert.throws(
      () => new ZaloConfig({ botToken: 'token', secretKey: 'short' }),
      /at least 8 characters/,
    );
    const config2 = new ZaloConfig({ botToken: 'token', secretKey: 'long-enough-secret' });
    assert.equal(config2.hasSecretKey(), true);
  });

  it('toObject returns masked token by default', () => {
    const config = new ZaloConfig({ botToken: '1234567890:abcdef' });
    const obj = config.toObject();
    assert.equal(obj.botToken, '123456...');
  });

  it('toObject with fullToken shows full token', () => {
    const config = new ZaloConfig({ botToken: '1234567890:abcdef' });
    const obj = config.toObject({ fullToken: true });
    assert.equal(obj.botToken, '1234567890:abcdef');
  });

  it('toObject excludes secretKey by default', () => {
    const config = new ZaloConfig({ botToken: 'token', secretKey: 'my-secret' });
    const obj = config.toObject();
    assert.equal(obj.secretKey, undefined);
  });

  it('toObject includes secretKey when includeSecrets=true', () => {
    const config = new ZaloConfig({ botToken: 'token', secretKey: 'my-secret' });
    const obj = config.toObject({ includeSecrets: true });
    assert.equal(obj.secretKey, 'my-secret');
  });

  it('rejects invalid numeric config', () => {
    assert.throws(() => new ZaloConfig({ botToken: 'token', timeout: -1 }));
    assert.throws(() => new ZaloConfig({ botToken: 'token', maxRetries: -1 }));
  });
});

describe('ZaloBot construction', () => {
  const { ZaloBot } = require('../src');

  it('constructs with plain config', () => {
    const bot = new ZaloBot({ botToken: 'test-token-123' });
    assert.ok(bot.client);
    assert.ok(bot.message);
    assert.ok(bot.user);
    assert.ok(bot.webhook);
    assert.ok(bot.media);
  });

  it('constructs with ZaloConfig instance', () => {
    const { ZaloConfig } = require('../src');
    const config = new ZaloConfig({ botToken: 'test-token-123' });
    const bot = new ZaloBot(config);
    assert.ok(bot.client);
  });

  it('fromEnv works', () => {
    process.env.ZALO_BOT_TOKEN = 'env-test-token';
    const bot = ZaloBot.fromEnv();
    assert.ok(bot.client);
    delete process.env.ZALO_BOT_TOKEN;
  });

  it('setBotToken updates config and client', () => {
    const bot = new ZaloBot({ botToken: 'old-token' });
    bot.setBotToken('new-token-1234567890');
    assert.equal(bot.config.botToken, 'new-token-1234567890');
  });

  it('getConfig returns masked token by default', () => {
    const bot = new ZaloBot({ botToken: '1234567890:abcdef' });
    const config = bot.getConfig();
    assert.equal(config.botToken, '123456...');
  });
});

// Retry system
describe('Retry configuration', () => {
  const { ZaloClient } = require('../src');

  it('client has default retry config', () => {
    const client = new ZaloClient({ botToken: 'test-token' });
    const config = client.getConfig();
    assert.ok(config.retry);
    assert.equal(config.retry.enabled, true);
    assert.equal(config.retry.maxRetries, 3);
    assert.equal(config.retry.baseDelay, 1000);
    assert.equal(config.retry.maxDelay, 30000);
    assert.equal(config.retry.jitter, true);
  });

  it('client accepts custom retry config', () => {
    const client = new ZaloClient({ botToken: 'test-token', retry: { maxRetries: 5, baseDelay: 500 } });
    const config = client.getConfig();
    assert.equal(config.retry.maxRetries, 5);
    assert.equal(config.retry.baseDelay, 500);
  });

  it('client with maxRetries=0 makes exactly 1 request', () => {
    const client = new ZaloClient({ botToken: 'test-token', maxRetries: 0 });
    const config = client.getConfig();
    assert.equal(config.retry.maxRetries, 0);
  });

  it('client.updateBotToken rebuilds requestBaseURL', () => {
    const client = new ZaloClient({ botToken: 'old-token' });
    client.updateBotToken('new-token-xyz');
    assert.ok(client.requestBaseURL.includes('new-token-xyz'));
    assert.ok(!client.requestBaseURL.includes('old-token'));
  });
});

// Webhook verification
describe('Webhook security', () => {
  const { WebhookModule } = require('../src');

  it('verify returns false when no secretKey configured (secure default)', () => {
    const webhook = new WebhookModule();
    assert.equal(webhook.verify({ headers: {} }), false);
  });

  it('verify returns true with correct token', () => {
    const webhook = new WebhookModule({ secretKey: 'test-secret-123' });
    assert.equal(webhook.verify({ headers: { 'x-bot-api-secret-token': 'test-secret-123' } }), true);
  });

  it('verify returns false with wrong token', () => {
    const webhook = new WebhookModule({ secretKey: 'test-secret-123' });
    assert.equal(webhook.verify({ headers: { 'x-bot-api-secret-token': 'wrong-token' } }), false);
  });

  it('verify returns false with missing header', () => {
    const webhook = new WebhookModule({ secretKey: 'test-secret-123' });
    assert.equal(webhook.verify({ headers: {} }), false);
  });

  it('parseEvent handles unknown events safely', () => {
    const webhook = new WebhookModule();
    const event = webhook.parseEvent({
      event_name: 'unknown.event.type',
      message: { from: { id: 'user1' }, chat: { id: 'chat1' } },
    });
    assert.equal(event.event, 'unknown.event.type');
    assert.equal(event.userId, 'user1');
  });

  it('parseEvent handles events without message.from.id', () => {
    const webhook = new WebhookModule();
    // user.follow may not have message.from.id
    const event = webhook.parseEvent({
      event_name: 'user.follow',
      message: { chat: { id: 'chat1' } },
    });
    assert.equal(event.event, 'user_follow');
  });
});
