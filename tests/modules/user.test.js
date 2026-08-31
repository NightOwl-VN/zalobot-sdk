/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for UserModule
 * Tests: getProfile, getFollowers, isFollowing, getProfileCached, clearCache
 * @module tests/modules/user
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloClient = require('../../src/client');
const UserModule = require('../../src/modules/user');
const { startMockServer, stopMockServer } = require('../helpers/mock-server');

describe('UserModule', () => {
  let mockServer;
  let mockBaseUrl;
  let client;
  let userModule;

  beforeEach(async () => {
    const mock = await startMockServer();
    mockServer = mock.server;
    mockBaseUrl = mock.baseUrl;
    client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });
    userModule = new UserModule(client);
  });

  afterEach(async () => {
    await stopMockServer(mockServer);
  });

  // ── getProfile ──────────────────────────────────────

  describe('getProfile()', () => {
    it('should return user profile for a valid userId', async () => {
      const result = await userModule.getProfile('123456789');
      assert.equal(result.ok, true);
      assert.equal(result.result.user_id, '123456789');
      assert.equal(result.result.display_name, 'User 123456789');
      assert.ok(result.result.avatar);
      assert.ok(result.result.cover);
      assert.equal(typeof result.result.is_follower, 'boolean');
    });

    it('should throw when userId is missing', async () => {
      await assert.rejects(
        () => userModule.getProfile(null),
        /userId is required and must be a string/
      );
    });

    it('should throw when userId is undefined', async () => {
      await assert.rejects(
        () => userModule.getProfile(undefined),
        /userId is required and must be a string/
      );
    });

    it('should throw when userId is empty string', async () => {
      await assert.rejects(
        () => userModule.getProfile(''),
        /userId is required and must be a string/
      );
    });

    it('should throw when userId is a number', async () => {
      await assert.rejects(
        () => userModule.getProfile(123456),
        /userId is required and must be a string/
      );
    });

    it('should make GET request to the correct path', async () => {
      await userModule.getProfile('99999');
      const req = mockServer._mock.lastRequest();
      assert.equal(req.method, 'GET');
      assert.equal(req.url, '/99999');
    });

    it('should pass fields option as query param', async () => {
      await userModule.getProfile('123', { fields: 'name,avatar' });
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('fields=name'));
      assert.ok(req.query.includes('avatar'));
    });

    it('should work without optional fields parameter', async () => {
      const result = await userModule.getProfile('123');
      assert.equal(result.ok, true);
    });
  });

  // ── getFollowers ────────────────────────────────────

  describe('getFollowers()', () => {
    it('should return followers list with default params', async () => {
      const result = await userModule.getFollowers();
      assert.equal(result.ok, true);
      assert.ok(Array.isArray(result.result.data));
      assert.ok(result.result.data.length > 0);
      assert.ok(result.result.data[0].user_id);
      assert.ok(result.result.data[0].display_name);
      assert.ok(result.result.paging);
    });

    it('should make GET request to /me/followers', async () => {
      await userModule.getFollowers();
      const req = mockServer._mock.lastRequest();
      assert.equal(req.method, 'GET');
      assert.equal(req.url, '/me/followers');
    });

    it('should include default limit of 50', async () => {
      await userModule.getFollowers();
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('limit=50'));
    });

    it('should pass custom limit parameter', async () => {
      await userModule.getFollowers({ limit: 100 });
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('limit=100'));
    });

    it('should pass cursor parameter when provided', async () => {
      await userModule.getFollowers({ cursor: 'page2_cursor' });
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('cursor=page2_cursor'));
    });

    it('should pass fields parameter when provided', async () => {
      await userModule.getFollowers({ fields: 'name,avatar' });
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('fields=name'));
    });

    it('should not include cursor when not provided', async () => {
      await userModule.getFollowers();
      const req = mockServer._mock.lastRequest();
      assert.ok(!req.query.includes('cursor='));
    });

    it('should not include fields when not provided', async () => {
      await userModule.getFollowers();
      const req = mockServer._mock.lastRequest();
      assert.ok(!req.query.includes('fields='));
    });

    it('should handle all params together', async () => {
      await userModule.getFollowers({ limit: 25, cursor: 'next', fields: 'id,name' });
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('limit=25'));
      assert.ok(req.query.includes('cursor=next'));
      assert.ok(req.query.includes('fields=id'));
    });
  });

  // ── isFollowing ─────────────────────────────────────

  describe('isFollowing()', () => {
    it('should return true when user profile exists (is a follower)', async () => {
      const result = await userModule.isFollowing('123456789');
      assert.equal(result, true);
    });

    it('should return false when API returns error code 2003', async () => {
      // Override the profile endpoint to return error code 2003
      mockServer._mock.setResponse('GET', '/not_follower', 200, {
        ok: false,
        error_code: 2003,
        description: 'User is not a follower',
      });

      const result = await userModule.isFollowing('not_follower');
      assert.equal(result, false);
    });

    it('should throw when userId is missing', async () => {
      await assert.rejects(
        () => userModule.isFollowing(null),
        /userId is required and must be a string/
      );
    });

    it('should throw when userId is undefined', async () => {
      await assert.rejects(
        () => userModule.isFollowing(undefined),
        /userId is required and must be a string/
      );
    });

    it('should throw when userId is empty string', async () => {
      await assert.rejects(
        () => userModule.isFollowing(''),
        /userId is required and must be a string/
      );
    });

    it('should re-throw non-2003 errors', async () => {
      // Override to return a different error code
      mockServer._mock.setResponse('GET', '/bad_user', 200, {
        ok: false,
        error_code: 5003,
        description: 'Some other error',
      });

      await assert.rejects(
        () => userModule.isFollowing('bad_user'),
        (err) => {
          assert.equal(err.code, 5003);
          return true;
        }
      );
    });
  });

  // ── getProfileCached ────────────────────────────────

  describe('getProfileCached()', () => {
    it('should return profile on first call (cache miss)', async () => {
      const result = await userModule.getProfileCached('123456789');
      assert.equal(result.ok, true);
      assert.equal(result.result.user_id, '123456789');
    });

    it('should return cached profile on second call (cache hit)', async () => {
      // First call — cache miss
      await userModule.getProfileCached('123456789');
      // Second call — should be cached (no additional request)
      const result = await userModule.getProfileCached('123456789');
      assert.equal(result.ok, true);
      assert.equal(result.result.user_id, '123456789');

      // Only 1 request should have been made (to /123456789)
      const requests = mockServer._mock.captureRequests();
      const profileRequests = requests.filter(
        (r) => r.method === 'GET' && r.url === '/123456789'
      );
      assert.equal(profileRequests.length, 1);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      // First call
      await userModule.getProfileCached('123456789');
      // Second call with forceRefresh
      await userModule.getProfileCached('123456789', { forceRefresh: true });

      // Two requests should have been made
      const requests = mockServer._mock.captureRequests();
      const profileRequests = requests.filter(
        (r) => r.method === 'GET' && r.url === '/123456789'
      );
      assert.equal(profileRequests.length, 2);
    });

    it('should use separate cache keys for different user IDs', async () => {
      await userModule.getProfileCached('user_a');
      await userModule.getProfileCached('user_b');

      const resultA = await userModule.getProfileCached('user_a');
      const resultB = await userModule.getProfileCached('user_b');

      assert.equal(resultA.result.user_id, 'user_a');
      assert.equal(resultB.result.user_id, 'user_b');

      // 4 requests total (2 per user)
      const requests = mockServer._mock.captureRequests();
      const requestsA = requests.filter(
        (r) => r.method === 'GET' && r.url === '/user_a'
      );
      const requestsB = requests.filter(
        (r) => r.method === 'GET' && r.url === '/user_b'
      );
      assert.equal(requestsA.length, 1);
      assert.equal(requestsB.length, 1);
    });

    it('should pass options through to getProfile', async () => {
      const result = await userModule.getProfileCached('123', { fields: 'name' });
      assert.equal(result.ok, true);
      const req = mockServer._mock.lastRequest();
      assert.ok(req.query.includes('fields=name'));
    });

    it('should propagate errors from getProfile', async () => {
      mockServer._mock.setResponse('GET', '/error_user', 200, {
        ok: false,
        error_code: 999,
        description: 'Server error',
      });

      await assert.rejects(
        () => userModule.getProfileCached('error_user'),
        (err) => err.code === 999
      );
    });

    it('should re-fetch when cache expires (simulated)', async () => {
      // First call — populate cache
      await userModule.getProfileCached('expiry_user');

      // Manually age the cache entry past the TTL (5 minutes = 300000ms)
      // Find the actual cache key (format: user:{userId}:{fields})
      const cacheKey = Array.from(userModule._cache.keys()).find(k => k.startsWith('user:expiry_user:'));
      assert.ok(cacheKey, 'cache entry should exist for expiry_user');
      const entry = userModule._cache.get(cacheKey);
      entry.timestamp = Date.now() - 300001; // Set timestamp 5 min + 1ms ago

      // Next call should re-fetch from server
      await userModule.getProfileCached('expiry_user');

      const requests = mockServer._mock.captureRequests();
      const profileRequests = requests.filter(
        (r) => r.method === 'GET' && r.url === '/expiry_user'
      );
      assert.equal(profileRequests.length, 2);
    });
  });

  // ── clearCache ──────────────────────────────────────

  describe('clearCache()', () => {
    it('should clear cache for a specific user ID', async () => {
      // Populate cache
      await userModule.getProfileCached('user_x');
      // Verify cache has an entry for user_x before clearing
      const hasBeforeClear = Array.from(userModule._cache.keys()).some(k => k.startsWith('user:user_x:'));
      assert.ok(hasBeforeClear, 'cache should have entry for user_x before clearing');

      // Clear specific entry
      userModule.clearCache('user_x');
      const hasAfterClear = Array.from(userModule._cache.keys()).some(k => k.startsWith('user:user_x:'));
      assert.ok(!hasAfterClear, 'cache should not have entry for user_x after clearing');
    });

    it('should clear all cache entries when no userId is provided', async () => {
      // Populate multiple entries
      await userModule.getProfileCached('user_1');
      await userModule.getProfileCached('user_2');
      await userModule.getProfileCached('user_3');
      assert.equal(userModule._cache.size, 3);

      // Clear all
      userModule.clearCache();
      assert.equal(userModule._cache.size, 0);
    });

    it('should make a fresh request after cache is cleared', async () => {
      // Populate cache
      await userModule.getProfileCached('cached_user');

      // Clear cache
      userModule.clearCache('cached_user');

      // Next call should hit the server again
      await userModule.getProfileCached('cached_user');

      const requests = mockServer._mock.captureRequests();
      const profileRequests = requests.filter(
        (r) => r.method === 'GET' && r.url === '/cached_user'
      );
      assert.equal(profileRequests.length, 2);
    });

    it('should not affect other users when clearing specific entry', async () => {
      // Populate cache for multiple users
      await userModule.getProfileCached('keep_user');
      await userModule.getProfileCached('remove_user');

      // Clear only one
      userModule.clearCache('remove_user');

      // After clearing remove_user, keep_user should still be in cache
      const hasKeepUser = Array.from(userModule._cache.keys()).some(k => k.startsWith('user:keep_user:'));
      assert.ok(hasKeepUser, 'other users cache preserved');
      const hasRemoveUser = Array.from(userModule._cache.keys()).some(k => k.startsWith('user:remove_user:'));
      assert.ok(!hasRemoveUser, 'removed user should not be in cache');
    });

    it('should be safe to call on a module with no cache initialized', async () => {
      const freshModule = new UserModule(client);
      // Should not throw
      freshModule.clearCache();
      assert.equal(freshModule._cache.size, 0);
    });

    it('should be safe to call clearCache for a non-existent userId', async () => {
      await userModule.getProfileCached('existing_user');
      // Clearing a user that doesn't exist shouldn't error
      userModule.clearCache('nonexistent_user');
      // Calling clearCache on non-existent user should be safe (no error, cache unchanged)
    const cacheSizeBefore = userModule.getCacheSize();
    userModule.clearCache('nonExistentUser');
    const cacheSizeAfter = userModule.getCacheSize();
    assert.ok(cacheSizeAfter >= cacheSizeBefore, 'clearCache non-existent user is safe');
    });
  });
});
