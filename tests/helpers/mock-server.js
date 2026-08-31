/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Mock HTTP server for Zalo Bot API testing
 * Simulates Zalo Bot API responses for offline testing
 * @module tests/helpers/mock-server
 */

const http = require('http');

/**
 * Create a mock HTTP server that simulates Zalo Bot API endpoints
 * @returns {http.Server} The mock HTTP server instance
 */
function createMockServer() {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch {}

      const url = (req.url || '').split('?')[0];
      const method = req.method;

      // POST /sendMessage
      if (method === 'POST' && url === '/sendMessage') {
        if (!parsed.chat_id || !parsed.text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error_code: -2, description: 'Invalid parameters' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'msg_' + Date.now(), date: Date.now() } }));
      }

      // POST /sendPhoto
      if (method === 'POST' && url === '/sendPhoto') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'img_' + Date.now(), date: Date.now() } }));
      }

      // POST /sendSticker
      if (method === 'POST' && url === '/sendSticker') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'stk_' + Date.now(), date: Date.now() } }));
      }

      // POST /sendVoice
      if (method === 'POST' && url === '/sendVoice') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'voice_' + Date.now(), date: Date.now() } }));
      }

      // POST /sendChatAction
      if (method === 'POST' && url === '/sendChatAction') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      }

      // GET /getMe
      if (method === 'GET' && url === '/getMe') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { id: '1459232241454765289', account_name: 'bot.mock', account_type: 'BASIC', can_join_groups: false } }));
      }

      // GET /getUpdates
      if (method === 'GET' && url === '/getUpdates') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: [] }));
      }

      // POST /setWebhook
      if (method === 'POST' && url === '/setWebhook') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { url: parsed.url || '', updated_at: Date.now(), verification: { ok: true } } }));
      }

      // POST /testWebhook
      if (method === 'POST' && url === '/testWebhook') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { ok: true, url: 'mock', status_code: 200, outcome: 'webhook.ok' } }));
      }

      // POST /deleteWebhook
      if (method === 'POST' && url === '/deleteWebhook') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { url: '', updated_at: Date.now() } }));
      }

      // GET /getWebhookInfo
      if (method === 'GET' && url === '/getWebhookInfo') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, result: { url: 'mock', updated_at: Date.now() } }));
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error_code: -10, description: 'Endpoint not found' }));
    });
  });
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
