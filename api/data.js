import { kv } from '@vercel/kv';

const VAZIO = { v: 1, clientes: {}, unidadeDe: {}, uploads: [], cancelados: {}, vendas: {}, uploadsCanc: [], modelo: '', modelosResgate: [], metas: {}, seq: 0 };

function unirPorId(a, b) {
  const m = new Map();
  (a || []).forEach(x => { if (x && x.id) m.set(x.id, x); });
  (b || []).forEach(x => { if (x && x.id) m.set(x.id, x); });
  return Array.from(m.values());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const estado = await kv.get('estado');
      return res.status(200).json(estado || VAZIO);
    } catch (e) {
      return res.status(503).json({ error: 'KV indisponível' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (!body.estado) return res.status(400).json({ error: 'Sem estado' });
    try {
      const server = await kv.get('estado');
      const base = server || VAZIO;
      const next = body.estado || {};
      const merged = {
        v: 1,
        clientes: Object.assign({}, base.clientes || {}, next.clientes || {}),
        unidadeDe: Object.assign({}, base.unidadeDe || {}, next.unidadeDe || {}),
        vendas: Object.assign({}, base.vendas || {}, next.vendas || {}),
        cancelados: Object.assign({}, base.cancelados || {}, next.cancelados || {}),
        uploads: unirPorId(base.uploads, next.uploads),
        uploadsCanc: unirPorId(base.uploadsCanc, next.uploadsCanc),
        modelo: next.modelo || base.modelo || '',
        modelosResgate: next.modelosResgate || base.modelosResgate || [],
        metas: Object.assign({}, base.metas || {}, next.metas || {}),
        seq: Math.max(base.seq || 0, next.seq || 0)
      };
      await kv.set('estado', merged);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao gravar no KV' });
    }
  }
  return res.status(405).json({ error: 'Método não permitido' });
}
