import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const PIN = process.env.ADMIN_PIN || '1234';
  const d = req.body || {};

  if (d.pin !== PIN) {
    return res.status(403).json({ error: 'Wrong PIN' });
  }

  try {
    await kv.set('gmg_scores', []);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset scores' });
  }
}
