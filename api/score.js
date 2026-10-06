import { kv } from '@vercel/kv';

const TARGET_PW = 'Welcome2GMG@2026';
const LEN = TARGET_PW.length;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const d = req.body || {};
  const name = String(d.name || '').trim().slice(0, 40);
  const dept = String(d.dept || '').trim().slice(0, 40);
  const timeMs = Number(d.timeMs);
  const keys = Number(d.keys);
  const errors = Number(d.errors);

  if (!name || !dept || !(timeMs > 0) || !(keys >= LEN) || !(errors >= 0)) {
    return res.status(400).json({ error: 'Invalid entry' });
  }
  if (timeMs < 1200) {
    return res.status(400).json({ error: 'Time too fast to be valid' });
  }

  const wpm = (LEN / 5) / (timeMs / 60000);
  const acc = Math.max(0, (keys - errors) / keys);
  const net = wpm * acc;
  const key = (name + '|' + dept).toLowerCase();

  const photo = typeof d.photo === 'string' && d.photo.startsWith('data:image/') && d.photo.length < 250e3 ? d.photo : '';
  const attempt = { name, dept, wpm: +wpm.toFixed(1), acc: +(acc * 100).toFixed(1), timeMs: Math.round(timeMs), net: +net.toFixed(1) };

  try {
    const raw = await kv.get('gmg_scores');
    let rows = Array.isArray(raw) ? raw : [];

    let row = rows.find(r => r.key === key);
    let best = false;

    if (!row) {
      row = { key, ...attempt, photo, attempts: 1 };
      rows.push(row);
      best = true;
    } else {
      row.attempts++;
      if (photo) row.photo = photo;
      if (net > row.net) {
        Object.assign(row, { key, ...attempt });
        best = true;
      }
    }

    await kv.set('gmg_scores', rows);

    const sorted = [...rows].sort((a, b) => b.net - a.net);
    const rank = sorted.findIndex(r => r.key === key) + 1;

    return res.status(200).json({ attempt, best, bestRow: row, rank, total: rows.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update score' });
  }
}
