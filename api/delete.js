import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

const rowId = key => createHash('sha256').update('gmg:' + key).digest('hex').slice(0, 12);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const PIN = process.env.ADMIN_PIN || '1234';
  const d = req.body || {};

  if (d.pin !== PIN) {
    return res.status(403).json({ error: 'Wrong PIN' });
  }

  // No id = just verifying the PIN (used when entering admin mode)
  if (!d.id) return res.status(200).json({ ok: true });

  try {
    const raw = await kv.get('gmg_scores');
    const rows = Array.isArray(raw) ? raw : [];
    const left = rows.filter(r => rowId(r.key) !== String(d.id));

    if (left.length === rows.length) {
      return res.status(404).json({ error: 'Score not found' });
    }

    await kv.set('gmg_scores', left);

    // also remove that player's entries from the live feed
    try {
      const rawFeed = await kv.get('gmg_feed');
      const feed = Array.isArray(rawFeed) ? rawFeed : [];
      await kv.set('gmg_feed', feed.filter(e => e.id !== String(d.id)));
    } catch (e) { /* ignore */ }

    return res.status(200).json({ ok: true, total: left.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete score' });
  }
}
