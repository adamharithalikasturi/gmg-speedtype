import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const raw = await kv.get('gmg_scores');
    const rows = Array.isArray(raw) ? raw : [];
    const sorted = [...rows].sort((a, b) => b.net - a.net);
    const cleaned = sorted.map(({ key, ...r }) => r);
    return res.status(200).json(cleaned);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}
