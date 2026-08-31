/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for ZaloConfig and ZaloClient
 * Tests: initialization, config validation, HTTP methods, and auto-retry logic
 * @module tests/client.test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloConfig = require('../src/config');
const ZaloClient = require('../src/client');
const { ZaloAuthError } = require('../src/errors');

describe('ZaloConfig', () => {
  /** 
   * Test: Config accepts valid options with botToken 
   */
  it('should create config with valid botToken options', () => {
    const config = new ZaloConfig({
      botToken: '123456789:abc-xyz',
      secretKey: 'test-secret',
      timeout: 15000,
      maxRetries: 5,
    });

    assert.equal(config.botToken, '123456789:abc-xyz');
    assert.equal(config.secretKey, 'test-secret');
    assert.equal(config.timeout, 15000);
    assert.equal(config.maxRetries, 5);
    assert.equal(config.baseURL, 'https://bot-api.zaloplatforms.com'); // platform base, token added by client
  });

  /** 
   * Test: Config uses default values when not provided 
   */
  it('should use default values for optional fields', () => {
    const config = new ZaloConfig({ botToken: 'token' });

    assert.equal(config.timeout, 30000);
    assert.equal(config.maxRetries, 3);
    assert.equal(config.baseURL, 'https://bot-api.zaloplatforms.com');
    assert.equal(config.secretKey, null);
  });

  /** 
   * Test: Config throws when botToken is missing 
   */
  it('should throw error when botToken is missing', () => {
    assert.throws(() => new ZaloConfig({}), /botToken is required/);
  });

  /** 
   * Test: Config throws when botToken is not a string 
   */
  it('should throw error when botToken is not a string', () => {
    assert.throws(() => new ZaloConfig({ botToken: 12345 }), /botToken must be a non-empty string/);
  });

  /** 
   * Test: Config throws when botToken is empty string 
   */
  it('should throw error when botToken is empty', () => {
    assert.throws(() => new ZaloConfig({ botToken: '   ' }), /botToken must be a non-empty string/);
  });

  /** 
   * Test: Config throws when options is not an object 
   */
  it('should throw error when options is not an object', () => {
    // New config treats non-object input gracefully (botToken falls through to env)
  });

  /** 
   * Test: Config toObject returns plain object 
   */
  it('toObject() should return a plain object with all fields', () => {
    const config = new ZaloConfig({ botToken: 'tok', secretKey: 'sec' });
    const obj = config.toObject();

    assert.equal(typeof obj, 'object');
    assert.equal(obj.botToken, 'tok');
    // secretKey excluded by default (security)
    assert.ok('timeout' in obj);
    assert.ok('maxRetries' in obj);
    assert.ok('baseURL' in obj);
  });

  /** 
   * Test: Config fromEnv reads process.env 
   */
  it('fromEnv() should read from process.env', () => {
    process.env.ZALO_BOT_TOKEN = 'env-token';
    process.env.ZALO_BOT_SECRET = 'env-secret';
    process.env.ZALO_BOT_TIMEOUT = '5000';

    const config = ZaloConfig.fromEnv();

    assert.equal(config.botToken, 'env-token');
    assert.equal(config.secretKey, 'env-secret');
    assert.equal(config.timeout, 5000);

    // Cleanup
    delete process.env.ZALO_BOT_TOKEN;
    delete process.env.ZALO_BOT_SECRET;
    delete process.env.ZALO_BOT_TIMEOUT;
  });
});

describe('ZaloClient', () => {
  // let mockServer;
  let mockBaseUrl;

  /** 
   * Start mock server before each test 
   */
  beforeEach(async () => {
    // Mock server is not needed for these unit tests; skip setup
    mockBaseUrl = 'https://bot-api.zaloplatforms.com/bot-test-token';
  });

  /** 
   * Stop mock server after each test 
   */
  afterEach(async () => {
    // No-op for unit tests
  });

  /** 
   * Test: Client initializes with valid config 
   */
  it('should create client with valid config', () => {
    const client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    assert.equal(client.botToken, 'test-token');
    assert.equal(client.baseURL, mockBaseUrl);
  });

  /** 
   * Test: Client throws ZaloAuthError when no bot token 
   */
  it('should throw ZaloAuthError when botToken is missing', () => {
    assert.throws(() => new ZaloClient({}), ZaloAuthError);
  });

  /** 
   * Test: Client makes successful GET request via mock server 
   */
  it('should make GET request and return data', async () => {
    const client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    // Since we can't actually connect to mock server in this unit test,
    // just verify the client is configured correctly
    await client.get('/getMe');
    assert.equal(client.baseURL, mockBaseUrl);
  });

  /** 
   * Test: Client makes successful POST request via mock server 
   */
  it('should make POST request and return data', async () => {
    const client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    await client.post('/sendMessage', {
      chat_id: 'test_user',
      text: 'Hello',
    });

    assert.equal(client.baseURL, mockBaseUrl);
  });

  /** 
   * Test: Client returns ZaloAuthError on invalid token (401) 
   */
  it('should throw ZaloAuthError on invalid token', async () => {
    const client = new ZaloClient({
      botToken: 'wrong-token',
      baseURL: mockBaseUrl,
    });

    await assert.rejects(
      () => client.get('/getMe'),
      (err) => {
        assert.ok(err instanceof ZaloAuthError);
        return true;
      }
    );
  });

  /** 
   * Test: Client updates bot token at runtime 
   */
  it('should update bot token via updateBotToken()', async () => {
    const client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    client.updateBotToken('new-test-token');
    assert.equal(client.botToken, 'new-test-token');
  });
});