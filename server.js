// GMG SpeedType server. No dependencies, just Node 16+. Run: ADMIN_PIN=yourpin node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const PIN = process.env.ADMIN_PIN || '1234';
const DB = path.join(process.env.DATA_DIR || __dirname, 'data.json');
const TARGET_PW = 'Welcome2GMG@2026';
const LEN = TARGET_PW.length;
let rows = []; try { rows = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
const save = () => fs.writeFileSync(DB, JSON.stringify(rows));
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const json = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
const body = req => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > 300e3) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b)); } catch { r({}); } }); });
const sorted = () => [...rows].sort((a, b) => b.net - a.net);

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/scores' && req.method === 'GET') return json(res, 200, sorted().map(({ key, ...r }) => r));
  if (url === '/api/score' && req.method === 'POST') {
    const d = await body(req);
    const name = String(d.name || '').trim().slice(0, 40), dept = String(d.dept || '').trim().slice(0, 40);
    const timeMs = Number(d.timeMs), keys = Number(d.keys), errors = Number(d.errors);
    if (!name || !dept || !(timeMs > 0) || !(keys >= LEN) || !(errors >= 0)) return json(res, 400, { error: 'Invalid entry' });
    if (timeMs < 1200) return json(res, 400, { error: 'Time too fast to be valid' });
    const wpm = (LEN / 5) / (timeMs / 60000);
    const acc = Math.max(0, (keys - errors) / keys);
    const net = wpm * acc;
    const key = (name + '|' + dept).toLowerCase();
    let row = rows.find(r => r.key === key);
    const photo = typeof d.photo === 'string' && d.photo.startsWith('data:image/') && d.photo.length < 120e3 ? d.photo : '';
    const attempt = { name, dept, wpm: +wpm.toFixed(1), acc: +(acc * 100).toFixed(1), timeMs: Math.round(timeMs), net: +net.toFixed(1) };
    let best = false;
    if (!row) { row = { key, ...attempt, photo, attempts: 1 }; rows.push(row); best = true; }
    else { row.attempts++; if (photo) row.photo = photo; if (net > row.net) { Object.assign(row, attempt); best = true; } }
    save();
    return json(res, 200, { attempt, best, bestRow: row, rank: sorted().findIndex(r => r.key === key) + 1, total: rows.length });
  }
  if (url === '/api/reset' && req.method === 'POST') {
    const d = await body(req);
    if (d.pin !== PIN) return json(res, 403, { error: 'Wrong PIN' });
    rows = []; save(); return json(res, 200, { ok: true });
  }
  const file = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);
  if (!file.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(buf);
  });
}).listen(PORT, () => console.log('GMG SpeedType running on port ' + PORT));
