const http = require('http');

function createMockServer(options = {}) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch {}

      const url = (req.url || '').split('?')[0];
      const method = req.method;

      res.writeHead(200, { 'Content-Type': 'application/json' });

      if (method === 'POST' && url === '/sendMessage') {
        if (!parsed.chat_id || !parsed.text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error_code: -2, description: 'Invalid parameters' }));
        }
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'msg_' + Date.now(), date: Date.now() } }));
      }

      if (method === 'POST' && url === '/sendPhoto') {
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'img_' + Date.now(), date: Date.now() } }));
      }
      if (method === 'POST' && url === '/sendSticker') {
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'stk_' + Date.now(), date: Date.now() } }));
      }
      if (method === 'POST' && url === '/sendVoice') {
        return res.end(JSON.stringify({ ok: true, result: { message_id: 'voice_' + Date.now(), date: Date.now() } }));
      }
      if (method === 'POST' && url === '/sendChatAction') {
        return res.end(JSON.stringify({ ok: true }));
      }
      if (method === 'GET' && url === '/getMe') {
        return res.end(JSON.stringify({ ok: true, result: { id: '1459232241454765289', account_name: 'bot.mock', account_type: 'BASIC', can_join_groups: false } }));
      }
      if (method === 'POST' && url === '/getUpdates') {
        return res.end(JSON.stringify({ ok: true, result: [] }));
      }
      if (method === 'POST' && url === '/setWebhook') {
        return res.end(JSON.stringify({ ok: true, result: { url: parsed.url || '', updated_at: Date.now(), verification: { ok: true } } }));
      }
      if (method === 'POST' && url === '/testWebhook') {
        return res.end(JSON.stringify({ ok: true, result: { ok: true, url: 'mock', status_code: 200, outcome: 'webhook.ok' } }));
      }
      if (method === 'POST' && url === '/deleteWebhook') {
        return res.end(JSON.stringify({ ok: true, result: { url: '', updated_at: Date.now() } }));
      }
      if (method === 'GET' && url === '/getWebhookInfo') {
        return res.end(JSON.stringify({ ok: true, result: { url: 'mock', updated_at: Date.now() } }));
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error_code: -10, description: 'Endpoint not found' }));
    });
  });
  return server;
}

function startMockServer(options = {}) {
  return new Promise((resolve, reject) => {
    const server = createMockServer(options);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, baseUrl: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

function stopMockServer(server) {
  return new Promise((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
}

module.exports = { createMockServer, startMockServer, stopMockServer };
