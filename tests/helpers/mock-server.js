/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Mock HTTP server for Zalo Bot API testing
 * Simulates Zalo API responses for offline testing
 * @module tests/helpers/mock-server
 */

const http = require('http');

/**
 * Simulated Zalo API error codes mapped to HTTP status
 */
const ERROR_RESPONSES = {
  '-1': { status: 400, body: { error: -1, message: 'Unknown error' } },
  '-2': { status: 400, body: { error: -2, message: 'Invalid parameters' } },
  '-3': { status: 401, body: { error: -3, message: 'Invalid access token' } },
  '-5': { status: 403, body: { error: -5, message: 'Invalid secret key' } },
  '-9': { status: 429, body: { error: -9, message: 'Rate limit exceeded' } },
  '-11': { status: 404, body: { error: -11, body: 'User not found' } },
};

/**
 * Create a mock HTTP server that simulates Zalo Bot API endpoints
 * @param {Object} [options] - Mock server options
 * @param {string} [options.accessToken='mock-token'] - Expected access token
 * @param {number} [options.port=0] - Port to listen on (0 = random)
 * @returns {http.Server} The mock HTTP server instance
 */
function createMockServer(options = {}) {
  const accessToken = options.accessToken || 'mock-token';

  const server = http.createServer((req, res) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      // Parse request body
      let parsed = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {
        parsed = {};
      }

      // Verify access token
      const token = req.headers['access_token'];
      if (token !== accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: -3, message: 'Invalid access token' }));
      }

      // Route handling
      const url = req.url.split('?')[0];

      // POST /me/messages - Send message
      if (req.method === 'POST' && url === '/me/messages') {
        if (!parsed.recipient || !parsed.message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: -2, message: 'Invalid parameters' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          message_id: 'msg_mock_' + Date.now(),
          recipient_id: parsed.recipient.user_id,
        }));
      }

      // GET /me/messages/:id - Get message
      if (req.method === 'GET' && url.startsWith('/me/messages/')) {
        const messageId = url.split('/').pop();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          message_id: messageId,
          status: 'delivered',
          timestamp: Date.now(),
        }));
      }

      // GET /me - Get profile
      if (req.method === 'GET' && url === '/me') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          id: 'user_mock_123',
          name: 'Mock User',
          avatar: 'https://example.com/avatar.jpg',
        }));
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: -10, message: 'Endpoint not found' }));
    });
  });

  return server;
}

/**
 * Start mock server on a random available port
 * @param {Object} [options] - Options passed to createMockServer
 * @returns {Promise<{ server: http.Server, port: number, baseUrl: string }>}
 */
function startMockServer(options = {}) {
  return new Promise((resolve, reject) => {
    const server = createMockServer(options);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        port,
        baseUrl: `http://127.0.0.1:${port}`,
      });
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
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

module.exports = {
  createMockServer,
  startMockServer,
  stopMockServer,
  ERROR_RESPONSES,
};
