import { kv } from '@vercel/kv';

const TARGET_PW = 'Welcome2GMG@2026';
const LEN = TARGET_PW.length;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const d = req.body || {};
  const name = String(d.name || '').trim().slice(0, 40);
  const dept = String(d.dept || '').trim().slice(0, 40);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 80);
  const timeMs = Number(d.timeMs);
  const keys = Number(d.keys);
  const errors = Number(d.errors);

  if (!name || !dept || !(timeMs > 0) || !(keys >= LEN) || !(errors >= 0)) {
    return res.status(400).json({ error: 'Invalid entry' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (timeMs < 1200) {
    return res.status(400).json({ error: 'Time too fast to be valid' });
  }

  const wpm = (LEN / 5) / (timeMs / 60000);
  const acc = Math.max(0, (keys - errors) / keys);
  const net = wpm * acc;
  // Email is the unique ID: one leaderboard spot per email
  const key = email;

  const photo = typeof d.photo === 'string' && d.photo.startsWith('data:image/') && d.photo.length < 250e3 ? d.photo : '';
  const attempt = { name, dept, wpm: +wpm.toFixed(1), acc: +(acc * 100).toFixed(1), timeMs: Math.round(timeMs), net: +net.toFixed(1) };

  try {
    const raw = await kv.get('gmg_scores');
    let rows = Array.isArray(raw) ? raw : [];

    // also matches older rows that were saved before email became the key
    let row = rows.find(r => r.key === key || (r.email && r.email === email));
    let best = false;

    if (!row) {
      row = { key, email, ...attempt, photo, attempts: 1 };
      rows.push(row);
      best = true;
    } else {
      row.attempts++;
      row.email = email;
      if (photo) row.photo = photo;
      if (net > row.net) {
        Object.assign(row, attempt);
        best = true;
      } else {
        // keep name/department current even if this attempt wasn't a new best
        row.name = name;
        row.dept = dept;
      }
    }

    await kv.set('gmg_scores', rows);

    const sorted = [...rows].sort((a, b) => b.net - a.net);
    const rank = sorted.findIndex(r => r.key === row.key) + 1;

    const { key: _k, email: _e, ...bestRow } = row;
    return res.status(200).json({ attempt, best, bestRow, rank, total: rows.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update score' });
  }
}
