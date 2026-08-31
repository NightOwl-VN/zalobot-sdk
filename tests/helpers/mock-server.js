/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Mock HTTP server for Zalo Bot API testing
 * Simulates Zalo Bot API responses for offline testing.
 *
 * Supports all SDK modules:
 *   - Message: sendMessage, sendPhoto, sendSticker, sendVoice, sendChatAction,
 *              getMe, getUpdates, setWebhook, testWebhook, deleteWebhook, getWebhookInfo
 *   - User:    GET /:userId (profile), GET /me/followers
 *   - Media:   POST /me/media/images, POST /me/media/files, GET /me/media/:id
 *
 * Testing helpers:
 *   - Request capture for assertions
 *   - Custom status/body overrides per endpoint
 *   - Configurable response delays for timeout testing
 *
 * @module tests/helpers/mock-server
 */

const http = require('http');

/**
 * Create a mock HTTP server that simulates Zalo Bot API endpoints.
 *
 * The returned server object carries helper methods for test assertions:
 *   server._mock.captureRequests()      — return array of captured requests
 *   server._mock.setResponse(method, url, status, body) — override an endpoint
 *   server._mock.setDelay(ms)           — add artificial delay to every response
 *   server._mock.reset()                — clear overrides, captured requests, and delay
 *
 * @returns {http.Server} The mock HTTP server instance
 */
function createMockServer() {
  // ── Test-control state ────────────────────────────────────────────
  const _state = {
    /** @type {Array<{method:string, url:string, headers:Object, body:any, query:string}>} */
    requests: [],
    /** @type {Map<string, {status:number, body:Object}>} key = "METHOD /path" */
    overrides: new Map(),
    /** Milliseconds added to every response (0 = none) */
    delay: 0,
  };

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch {}

      const url = (req.url || '').split('?')[0];
      const query = (req.url || '').split('?')[1] || '';
      const method = req.method;
      const key = `${method} ${url}`;

      // ── Capture every request for later assertions ───────────────
      _state.requests.push({
        method,
        url,
        headers: { ...req.headers },
        body: parsed,
        query,
      });

      // ── Helper to send a response (with optional delay) ──────────
      const send = (status, bodyObj) => {
        const payload = JSON.stringify(bodyObj);
        const finish = () => {
          res.writeHead(status, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          });
          res.end(payload);
        };
        if (_state.delay > 0) {
          setTimeout(finish, _state.delay);
        } else {
          finish();
        }
      };

      // ── Check for test overrides first ───────────────────────────
      if (_state.overrides.has(key)) {
        const o = _state.overrides.get(key);
        return send(o.status, o.body);
      }

      // =============================================================
      //  Message module endpoints
      // =============================================================

      // POST /sendMessage
      if (method === 'POST' && url === '/sendMessage') {
        if (!parsed.chat_id || !parsed.text) {
          return send(400, { ok: false, error_code: -2, description: 'Invalid parameters' });
        }
        return send(200, { ok: true, result: { message_id: 'msg_' + Date.now(), date: Date.now() } });
      }

      // POST /sendPhoto
      if (method === 'POST' && url === '/sendPhoto') {
        return send(200, { ok: true, result: { message_id: 'img_' + Date.now(), date: Date.now() } });
      }

      // POST /sendSticker
      if (method === 'POST' && url === '/sendSticker') {
        return send(200, { ok: true, result: { message_id: 'stk_' + Date.now(), date: Date.now() } });
      }

      // POST /sendVoice
      if (method === 'POST' && url === '/sendVoice') {
        return send(200, { ok: true, result: { message_id: 'voice_' + Date.now(), date: Date.now() } });
      }

      // POST /sendChatAction
      if (method === 'POST' && url === '/sendChatAction') {
        return send(200, { ok: true });
      }

      // GET /getMe
      if (method === 'GET' && url === '/getMe') {
        return send(200, {
          ok: true,
          result: {
            id: '1459232241454765289',
            account_name: 'bot.mock',
            account_type: 'BASIC',
            can_join_groups: false,
          },
        });
      }

      // GET /getUpdates
      if (method === 'GET' && url === '/getUpdates') {
        return send(200, { ok: true, result: [] });
      }

      // POST /setWebhook
      if (method === 'POST' && url === '/setWebhook') {
        return send(200, {
          ok: true,
          result: {
            url: parsed.url || '',
            updated_at: Date.now(),
            verification: { ok: true },
          },
        });
      }

      // POST /testWebhook
      if (method === 'POST' && url === '/testWebhook') {
        return send(200, {
          ok: true,
          result: {
            ok: true,
            url: 'mock',
            status_code: 200,
            outcome: 'webhook.ok',
          },
        });
      }

      // POST /deleteWebhook
      if (method === 'POST' && url === '/deleteWebhook') {
        return send(200, { ok: true, result: { url: '', updated_at: Date.now() } });
      }

      // GET /getWebhookInfo
      if (method === 'GET' && url === '/getWebhookInfo') {
        return send(200, { ok: true, result: { url: 'mock', updated_at: Date.now() } });
      }

      // =============================================================
      //  User module endpoints
      // =============================================================

      // GET /me/followers  (UserModule.getFollowers)
      if (method === 'GET' && url === '/me/followers') {
        return send(200, {
          ok: true,
          result: {
            data: [
              { user_id: 'user_001', display_name: 'Alice', avatar: 'https://example.com/alice.jpg' },
              { user_id: 'user_002', display_name: 'Bob', avatar: 'https://example.com/bob.jpg' },
            ],
            paging: { limit: 50, offset: 0, total: 2 },
          },
        });
      }

      // =============================================================
      //  Media module endpoints
      // =============================================================

      // POST /me/media/images  (MediaModule._upload type=image)
      if (method === 'POST' && url === '/me/media/images') {
        return send(200, {
          ok: true,
          result: {
            attachment_id: 'img_att_' + Date.now(),
            token: 'media_token_' + Date.now(),
          },
        });
      }

      // POST /me/media/files  (MediaModule._upload type=file)
      if (method === 'POST' && url === '/me/media/files') {
        return send(200, {
          ok: true,
          result: {
            attachment_id: 'file_att_' + Date.now(),
            token: 'media_token_' + Date.now(),
          },
        });
      }

      // GET /me/media/:id  (MediaModule.getMediaUrl)
      // Match /me/media/<anything>
      if (method === 'GET' && /^\/me\/media\/[^/]+$/.test(url)) {
        const mediaId = url.split('/').pop();
        return send(200, {
          ok: true,
          result: {
            url: `https://storage.zaloapp.com/media/${mediaId}`,
            type: 'image',
            size: 1024,
          },
        });
      }

      // =============================================================
      //  Parameterized: User profile  GET /:userId
      //  (UserModule.getProfile) — must come AFTER all named routes
      // =============================================================
      if (method === 'GET' && /^\/[^/]+$/.test(url)) {
        const userId = url.slice(1); // strip leading "/"
        return send(200, {
          ok: true,
          result: {
            user_id: userId,
            display_name: `User ${userId}`,
            avatar: `https://example.com/avatar/${userId}.jpg`,
            cover: `https://example.com/cover/${userId}.jpg`,
            is_follower: true,
          },
        });
      }

      // =============================================================
      //  Default 404
      // =============================================================
      send(404, { ok: false, error_code: -10, description: 'Endpoint not found' });
    });
  });

  // ── Attach test-control API to the server instance ──────────────
  server._mock = {
    /**
     * Return all captured requests so far.
     * @returns {Array<{method:string, url:string, headers:Object, body:any, query:string}>}
     */
    captureRequests() {
      return _state.requests.slice();
    },

    /**
     * Return the most recent captured request (or null if none).
     * @returns {Object|null}
     */
    lastRequest() {
      return _state.requests.length > 0 ? _state.requests[_state.requests.length - 1] : null;
    },

    /**
     * Override a specific endpoint's response.
     *
     * @param {string} method - HTTP method ('GET', 'POST', …)
     * @param {string} url - URL path (e.g. '/sendMessage', '/me/media/images')
     * @param {number} status - HTTP status code to return
     * @param {Object} body - JSON body to return
     *
     * @example
     *   // Simulate a 401 Unauthorized
     *   server._mock.setResponse('GET', '/getMe', 401, {
     *     ok: false, error_code: 401, description: 'Unauthorized'
     *   });
     */
    setResponse(method, url, status, body) {
      _state.overrides.set(`${method} ${url}`, { status, body });
    },

    /**
     * Add an artificial delay (ms) to every mock response.
     * Useful for testing client timeout behavior.
     * Pass 0 to remove the delay.
     *
     * @param {number} ms - Delay in milliseconds
     */
    setDelay(ms) {
      _state.delay = Math.max(0, ms | 0);
    },

    /**
     * Clear all overrides, captured requests, and delay.
     */
    reset() {
      _state.overrides.clear();
      _state.requests.length = 0;
      _state.delay = 0;
    },
  };

  return server;
}

/**
 * Start mock server on a random available port
 * @returns {Promise<{ server: http.Server, baseUrl: string }>}
 */
function startMockServer() {
  return new Promise((resolve, reject) => {
    const server = createMockServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

/**
 * Stop a mock server gracefully
 * @param {http.Server} server - Server to stop
 * @returns {Promise<void>}
 */
function stopMockServer(server) {
  return new Promise((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
}

module.exports = { createMockServer, startMockServer, stopMockServer };
