import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const raw = await kv.get('gmg_feed');
    const feed = Array.isArray(raw) ? raw : [];
    // newest first; strip the internal id before sending to the public page
    const cleaned = feed.slice(0, 30).map(({ id, ...e }) => e);
    return res.status(200).json(cleaned);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}
