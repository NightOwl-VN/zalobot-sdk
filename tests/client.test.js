/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for ZaloConfig and ZaloClient
 * Tests: initialization, config validation, HTTP methods, and auto-retry logic
 * ALL HTTP tests use mock server on 127.0.0.1 — never hits production.
 * @module tests/client.test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloConfig = require('../src/config');
const ZaloClient = require('../src/client');
const { ZaloAuthError } = require('../src/errors');
const { startMockServer, stopMockServer } = require('./helpers/mock-server');

describe('ZaloConfig', () => {
  it('should create config with valid botToken options', () => {
    const config = new ZaloConfig({
      botToken: '123456789:abc-xyz',
      secretKey: 'test-secret-key',
      timeout: 15000,
      maxRetries: 5,
    });

    assert.equal(config.botToken, '123456789:abc-xyz');
    assert.equal(config.secretKey, 'test-secret-key');
    assert.equal(config.timeout, 15000);
    assert.equal(config.maxRetries, 5);
    assert.equal(config.baseURL, 'https://bot-api.zaloplatforms.com');
  });

  it('should use default values for optional fields', () => {
    const config = new ZaloConfig({ botToken: 'token' });

    assert.equal(config.timeout, 30000);
    assert.equal(config.maxRetries, 3);
    assert.equal(config.baseURL, 'https://bot-api.zaloplatforms.com');
    assert.equal(config.secretKey, null);
  });

  it('should throw error when botToken is missing', () => {
    assert.throws(() => new ZaloConfig({}), /botToken is required/);
  });

  it('should throw error when botToken is not a string', () => {
    assert.throws(() => new ZaloConfig({ botToken: 12345 }), /botToken must be a non-empty string/);
  });

  it('should throw error when botToken is empty', () => {
    assert.throws(() => new ZaloConfig({ botToken: '  ' }), /botToken must be a non-empty string/);
  });

  it('toObject() masks token by default, excludes secretKey', () => {
    const config = new ZaloConfig({ botToken: 'tok-1234567890', secretKey: 'secret-key-long' });
    const obj = config.toObject();

    assert.equal(typeof obj, 'object');
    assert.ok(obj.botToken.includes('...'), 'token should be masked');
    assert.ok(!obj.botToken.includes('tok-1234567890'), 'full token not exposed');
    assert.equal(obj.secretKey, undefined);
    assert.ok('timeout' in obj);
    assert.ok('maxRetries' in obj);
    assert.ok('baseURL' in obj);
  });

  it('toObject({ fullToken: true }) reveals full token', () => {
    const config = new ZaloConfig({ botToken: 'tok-1234567890' });
    const obj = config.toObject({ fullToken: true });
    assert.equal(obj.botToken, 'tok-1234567890');
  });

  it('toObject({ includeSecrets: true }) includes secretKey', () => {
    const config = new ZaloConfig({ botToken: 'token-123456', secretKey: 'my-secret-here' });
    const obj = config.toObject({ includeSecrets: true });
    assert.equal(obj.secretKey, 'my-secret-here');
  });

  it('fromEnv() should read from process.env', () => {
    process.env.ZALO_BOT_TOKEN = 'env-token-123456';
    process.env.ZALO_BOT_SECRET = 'env-secret-123456';
    process.env.ZALO_BOT_TIMEOUT = '5000';

    const config = ZaloConfig.fromEnv();

    assert.equal(config.botToken, 'env-token-123456');
    assert.equal(config.secretKey, 'env-secret-123456');
    assert.equal(config.timeout, 5000);

    delete process.env.ZALO_BOT_TOKEN;
    delete process.env.ZALO_BOT_SECRET;
    delete process.env.ZALO_BOT_TIMEOUT;
  });

  it('hasSecretKey returns true only for valid length', () => {
    const c1 = new ZaloConfig({ botToken: 'token-123456', secretKey: 'short' });
    assert.equal(c1.hasSecretKey(), false);
    const c2 = new ZaloConfig({ botToken: 'token-123456', secretKey: 'long-enough-secret' });
    assert.equal(c2.hasSecretKey(), true);
  });

  it('rejects invalid numeric config', () => {
    assert.throws(() => new ZaloConfig({ botToken: 'token-123456', timeout: -1 }));
    assert.throws(() => new ZaloConfig({ botToken: 'token-123456', maxRetries: -1 }));
  });
});

describe('ZaloClient', () => {
  it('should create client with valid config', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
    });

    assert.equal(client.botToken, 'test-token-123');
    assert.equal(client.apiBaseURL, mockBaseUrl);
    assert.equal(client.requestBaseURL, `${mockBaseUrl}/bottest-token-123`);

    await stopMockServer(mockServer);
  });

  it('should throw ZaloAuthError when botToken is missing', () => {
    assert.throws(() => new ZaloClient({}), ZaloAuthError);
  });

  it('should make GET request via mock server', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
    });

    const result = await client.get('getMe');
    assert.equal(result.ok, true);
    assert.ok(result.result);
    assert.equal(result.result.account_name, 'bot.mock');

    await stopMockServer(mockServer);
  });

  it('should make POST request via mock server', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
    });

    const result = await client.post('sendMessage', {
      chat_id: 'test_user',
      text: 'Hello',
    });
    assert.equal(result.ok, true);
    assert.ok(result.result.message_id);

    await stopMockServer(mockServer);
  });

  it('should throw ZaloAuthError on 401 response', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mockServer._mock.setResponse('GET', '/getMe', 401, {
      ok: false, error_code: 401, description: 'Unauthorized',
    });

    const client = new ZaloClient({
      botToken: 'wrong-token-123',
      baseURL: mockBaseUrl,
    });

    await assert.rejects(
      () => client.get('getMe'),
      (err) => {
        assert.ok(err instanceof ZaloAuthError);
        return true;
      }
    );

    await stopMockServer(mockServer);
  });

  it('should update bot token via updateBotToken()', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    const client = new ZaloClient({
      botToken: 'old-token-123456',
      baseURL: mockBaseUrl,
    });

    client.updateBotToken('new-token-123456');
    assert.equal(client.botToken, 'new-token-123456');
    assert.ok(client.requestBaseURL.includes('new-token-123456'));
    assert.ok(!client.requestBaseURL.includes('old-token'));

    await stopMockServer(mockServer);
  });

  it('should mask token in getConfig()', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    const client = new ZaloClient({
      botToken: '1234567890:abcdef',
      baseURL: mockBaseUrl,
    });

    const config = client.getConfig();
    assert.ok(!config.botToken.includes('1234567890:abcdef'), 'token should be masked');
    assert.ok(config.botToken.includes('...'), 'token should contain ...');
    assert.ok(config.apiBaseURL);
    assert.ok(config.requestBaseURL);

    await stopMockServer(mockServer);
  });
  it('should retry on 429 and succeed on second attempt', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mockServer._mock.setSequentialResponses('GET', '/getMe', [
      { status: 429, body: { ok: false, error_code: 429, description: 'Too Many Requests' } },
      { status: 200, body: { ok: true, result: { id: 'bot', account_name: 'bot' } } },
    ]);

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: true, maxRetries: 3, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    const result = await client.get('getMe');
    assert.equal(result.ok, true);

    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 2, 'should have made 2 requests (1 retry)');

    await stopMockServer(mockServer);
  });

  it('should exhaust retries on persistent 429', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mockServer._mock.setSequentialResponses('GET', '/getMe', [
      { status: 429, body: { ok: false, error_code: 429, description: 'Rate Limited' } },
      { status: 429, body: { ok: false, error_code: 429, description: 'Rate Limited' } },
      { status: 429, body: { ok: false, error_code: 429, description: 'Rate Limited' } },
      { status: 429, body: { ok: false, error_code: 429, description: 'Rate Limited' } },
    ]);

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: true, maxRetries: 3, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    await assert.rejects(() => client.get('getMe'));
    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 4, 'should have made 4 requests (1 original + 3 retries)');

    await stopMockServer(mockServer);
  });

  it('should not retry when maxRetries=0', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mock.server._mock.setResponse('GET', '/getMe', 429, {
      ok: false, error_code: 429, description: 'Rate Limited',
    });

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: true, maxRetries: 0, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    await assert.rejects(() => client.get('getMe'));
    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 1, 'should have made exactly 1 request');

    await stopMockServer(mockServer);
  });

  it('should not retry on 401', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mock.server._mock.setResponse('GET', '/getMe', 401, {
      ok: false, error_code: 401, description: 'Unauthorized',
    });

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: true, maxRetries: 3, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    await assert.rejects(() => client.get('getMe'));
    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 1, 'should not retry 401');

    await stopMockServer(mockServer);
  });

  it('should not retry on 400', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mock.server._mock.setResponse('POST', '/sendMessage', 400, {
      ok: false, error_code: -2, description: 'Bad Request',
    });

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: true, maxRetries: 3, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    await assert.rejects(() => client.post('sendMessage', { chat_id: 'x', text: 'y' }));
    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 1, 'should not retry 400');

    await stopMockServer(mockServer);
  });

  it('should not retry when retry.enabled=false', async () => {
    const mock = await startMockServer();
    const mockServer = mock.server;
    const mockBaseUrl = mock.baseUrl;

    mock.server._mock.setResponse('GET', '/getMe', 429, {
      ok: false, error_code: 429, description: 'Rate Limited',
    });

    const client = new ZaloClient({
      botToken: 'test-token-123',
      baseURL: mockBaseUrl,
      retry: { enabled: false, maxRetries: 3, baseDelay: 10, maxDelay: 50, jitter: false },
    });

    await assert.rejects(() => client.get('getMe'));
    const requests = mock.server._mock.captureRequests();
    assert.equal(requests.length, 1, 'should not retry when disabled');

    await stopMockServer(mockServer);
  });
});
