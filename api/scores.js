import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

// Short public id so the admin can delete one row without exposing emails
const rowId = key => createHash('sha256').update('gmg:' + key).digest('hex').slice(0, 12);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const raw = await kv.get('gmg_scores');
    const rows = Array.isArray(raw) ? raw : [];
    const sorted = [...rows].sort((a, b) => b.net - a.net);
    // Never expose the full email publicly; only the part before the @
    const cleaned = sorted.map(({ key, email, ...r }) => ({
      ...r,
      id: rowId(key),
      username: email ? String(email).split('@')[0] : ''
    }));
    return res.status(200).json(cleaned);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}
