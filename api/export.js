import { kv } from '@vercel/kv';

// Prevent spreadsheet formula injection and escape CSV fields
const cell = v => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const PIN = process.env.ADMIN_PIN || '1234';
  const d = req.body || {};
  if (d.pin !== PIN) {
    return res.status(403).json({ error: 'Wrong PIN' });
  }

  try {
    const raw = await kv.get('gmg_scores');
    const rows = (Array.isArray(raw) ? raw : []).sort((a, b) => b.net - a.net);

    const header = ['Rank', 'Name', 'Email', 'Department', 'WPM', 'Accuracy %', 'Time (s)', 'Score', 'Attempts'];
    const lines = rows.map((r, i) => [
      i + 1,
      r.name,
      r.email || '',
      r.dept,
      r.wpm,
      r.acc,
      (r.timeMs / 1000).toFixed(2),
      r.net,
      r.attempts || 1
    ].map(cell).join(','));

    const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gmg-fastest-fingers.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Export failed' });
  }
}
