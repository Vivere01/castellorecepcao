import { kvDisponivel, kvGet, kvSet } from './_lib/kv.js';

const VAZIO = { v: 1, clientes: {}, cancelados: {}, uploads: [], uploadsCanc: [], seq: 0 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    if (!kvDisponivel()) return res.status(200).json(VAZIO);
    const estado = await kvGet('estado', null);
    return res.status(200).json(estado || VAZIO);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (!body.estado) return res.status(400).json({ error: 'Sem estado' });
    if (!kvDisponivel()) return res.status(200).json({ ok: true });
    await kvSet('estado', body.estado);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método não permitido' });
}
