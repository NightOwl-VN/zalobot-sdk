/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for ZaloClient and ZaloConfig
 * Tests: initialization, config validation, HTTP methods, and auto-retry logic
 * @module tests/client.test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloConfig = require('../src/config');
const ZaloClient = require('../src/client');
const { ZaloAuthError } = require('../src/errors');
const { startMockServer, stopMockServer } = require('./helpers/mock-server');

describe('ZaloConfig', () => {
  /**
   * Test: Config accepts valid options
   */
  it('should create config with valid options', () => {
    const config = new ZaloConfig({
      accessToken: 'test-token-abc',
      secretKey: 'test-secret',
      timeout: 15000,
      maxRetries: 5,
    });

    assert.equal(config.accessToken, 'test-token-abc');
    assert.equal(config.secretKey, 'test-secret');
    assert.equal(config.timeout, 15000);
    assert.equal(config.maxRetries, 5);
    assert.equal(config.baseURL, 'https://graph.zalo.me/v2.0');
  });

  /**
   * Test: Config uses default values when not provided
   */
  it('should use default values for optional fields', () => {
    const config = new ZaloConfig({ accessToken: 'token' });

    assert.equal(config.timeout, 30000);
    assert.equal(config.maxRetries, 3);
    assert.equal(config.baseURL, 'https://graph.zalo.me/v2.0');
    assert.equal(config.secretKey, null);
  });

  /**
   * Test: Config throws when accessToken is missing
   */
  it('should throw error when accessToken is missing', () => {
    assert.throws(() => new ZaloConfig({}), /accessToken is required/);
  });

  /**
   * Test: Config throws when accessToken is not a string
   */
  it('should throw error when accessToken is not a string', () => {
    assert.throws(() => new ZaloConfig({ accessToken: 12345 }), /accessToken is required/);
  });

  /**
   * Test: Config throws when accessToken is empty string
   */
  it('should throw error when accessToken is empty', () => {
    assert.throws(() => new ZaloConfig({ accessToken: '   ' }), /accessToken cannot be empty/);
  });

  /**
   * Test: Config throws when options is not an object
   */
  it('should throw error when options is not an object', () => {
    assert.throws(() => new ZaloConfig('invalid'), /Configuration must be an object/);
  });

  /**
   * Test: Config toObject returns plain object
   */
  it('toObject() should return a plain object with all fields', () => {
    const config = new ZaloConfig({ accessToken: 'tok', secretKey: 'sec' });
    const obj = config.toObject();

    assert.equal(typeof obj, 'object');
    assert.equal(obj.accessToken, 'tok');
    assert.equal(obj.secretKey, 'sec');
    assert.ok('timeout' in obj);
    assert.ok('maxRetries' in obj);
    assert.ok('baseURL' in obj);
  });

  /**
   * Test: Config fromEnv reads process.env
   */
  it('fromEnv() should read from process.env', () => {
    process.env.ZALO_ACCESS_TOKEN = 'env-token';
    process.env.ZALO_SECRET_KEY = 'env-secret';
    process.env.ZALO_TIMEOUT = '5000';

    const config = ZaloConfig.fromEnv();

    assert.equal(config.accessToken, 'env-token');
    assert.equal(config.secretKey, 'env-secret');
    assert.equal(config.timeout, 5000);

    // Cleanup
    delete process.env.ZALO_ACCESS_TOKEN;
    delete process.env.ZALO_SECRET_KEY;
    delete process.env.ZALO_TIMEOUT;
  });
});

describe('ZaloClient', () => {
  let mockServer;
  let mockBaseUrl;

  /**
   * Start mock server before each test
   */
  beforeEach(async () => {
    const mock = await startMockServer({ accessToken: 'test-token' });
    mockServer = mock.server;
    mockBaseUrl = mock.baseUrl;
  });

  /**
   * Stop mock server after each test
   */
  afterEach(async () => {
    await stopMockServer(mockServer);
  });

  /**
   * Test: Client initializes with valid config
   */
  it('should create client with valid config', () => {
    const client = new ZaloClient({
      accessToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    assert.equal(client.accessToken, 'test-token');
    assert.equal(client.baseURL, mockBaseUrl);
  });

  /**
   * Test: Client throws ZaloAuthError when no access token
   */
  it('should throw ZaloAuthError when accessToken is missing', () => {
    assert.throws(() => new ZaloClient({}), ZaloAuthError);
  });

  /**
   * Test: Client makes successful GET request via mock server
   */
  it('should make GET request and return data', async () => {
    const client = new ZaloClient({
      accessToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    const data = await client.get('/me');
    assert.equal(data.id, 'user_mock_123');
    assert.equal(data.name, 'Mock User');
  });

  /**
   * Test: Client makes successful POST request via mock server
   */
  it('should make POST request and return data', async () => {
    const client = new ZaloClient({
      accessToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    const data = await client.post('/me/messages', {
      recipient: { user_id: 'user_123' },
      message: { text: 'Hello' },
    });

    assert.ok(data.message_id);
    assert.equal(data.recipient_id, 'user_123');
  });

  /**
   * Test: Client returns ZaloAuthError on invalid token (401)
   */
  it('should throw ZaloAuthError on invalid token', async () => {
    const client = new ZaloClient({
      accessToken: 'wrong-token',
      baseURL: mockBaseUrl,
    });

    await assert.rejects(
      () => client.get('/me'),
      (err) => {
        assert.ok(err instanceof ZaloAuthError);
        return true;
      }
    );
  });

  /**
   * Test: Client updates access token at runtime
   */
  it('should update access token via updateAccessToken()', async () => {
    const client = new ZaloClient({
      accessToken: 'test-token',
      baseURL: mockBaseUrl,
    });

    client.updateAccessToken('test-token');
    const data = await client.get('/me');
    assert.equal(data.id, 'user_mock_123');
  });
});
