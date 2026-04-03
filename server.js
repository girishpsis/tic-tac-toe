// Quick Draw! - Local proxy server (no npm install needed)
// Usage:
//   Windows CMD:        set ANTHROPIC_API_KEY=sk-ant-xxx && node server.js
//   Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-xxx"; node server.js
//   Mac/Linux:          ANTHROPIC_API_KEY=sk-ant-xxx node server.js
//
// OR create a .env file in this folder with:
//   ANTHROPIC_API_KEY=sk-ant-xxx

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Load .env file if present ──────────────────────────────
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach(line => {
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (k && !process.env[k]) process.env[k] = v;
      }
    });
} catch (_) {}

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const PORT    = 3001;

if (!API_KEY) {
  console.error('\n⚠️  ANTHROPIC_API_KEY is not set!');
  console.error('Create a .env file with:  ANTHROPIC_API_KEY=sk-ant-...\n');
}

// ── Server ─────────────────────────────────────────────────
http.createServer((req, res) => {
  // CORS — allow the HTML file to call us
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ── Health check ──
  if (req.url === '/ping') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok: true, hasKey: !!API_KEY }));
    return;
  }

  // ── Claude proxy ──
  if (req.url === '/claude' && req.method === 'POST') {
    if (!API_KEY) {
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set on server.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const opts = {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers:  {
          'Content-Type':      'application/json',
          'x-api-key':         API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length':    Buffer.byteLength(body)
        }
      };

      const apiReq = https.request(opts, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, {'Content-Type':'application/json'});
          res.end(data);
        });
      });

      apiReq.on('error', e => {
        res.writeHead(502, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      });

      apiReq.write(body);
      apiReq.end();
    });
    return;
  }

  // ── Serve the game HTML ──
  if (req.url === '/' || req.url === '/quickdraw.html') {
    const file = path.join(__dirname, 'quickdraw.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('quickdraw.html not found'); return; }
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');

}).listen(PORT, '127.0.0.1', () => {
  console.log('\n🎨 Quick Draw! AI server is running');
  console.log(`🎮 Open this in your browser: http://localhost:${PORT}`);
  console.log(`🔑 API key: ${API_KEY ? '✅ loaded' : '❌ MISSING — set ANTHROPIC_API_KEY'}`);
  console.log('\nPress Ctrl+C to stop.\n');
});
