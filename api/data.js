import { kv } from '@vercel/kv';

const VAZIO = {
  v: 1,
  clientes: {},
  unidadeDe: {},
  uploads: [],
  cancelados: {},
  vendas: {},
  uploadsCanc: [],
  assinantes: {},
  uploadsAss: [],
  lancamentos: {},
  modelo: '',
  modelosResgate: [],
  metas: {},
  seq: 0,
  criadoEm: '',
  atualizadoEm: ''
};

function unirPorId(a, b) {
  const m = new Map();
  (a || []).forEach(x => { if (x && (x.id || x.data)) m.set(x.id || (x.data + '-' + x.arquivo), x); });
  (b || []).forEach(x => { if (x && (x.id || x.data)) m.set(x.id || (x.data + '-' + x.arquivo), x); });
  return Array.from(m.values());
}

function mesclarDicionario(baseObj, nextObj) {
  const out = Object.assign({}, baseObj || {});
  const next = nextObj || {};
  for (const k of Object.keys(next)) {
    const a = next[k];
    const b = out[k];
    if (!b) {
      out[k] = a;
    } else {
      const ta = (a && (a.ultimaAlteracao || a.data || a.atualizadoEm || a.vencimento)) || '';
      const tb = (b && (b.ultimaAlteracao || b.data || b.atualizadoEm || b.vencimento)) || '';
      if (ta >= tb) {
        out[k] = a;
      }
    }
  }
  return out;
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
        clientes: mesclarDicionario(base.clientes, next.clientes),
        unidadeDe: Object.assign({}, base.unidadeDe || {}, next.unidadeDe || {}),
        vendas: mesclarDicionario(base.vendas, next.vendas),
        cancelados: mesclarDicionario(base.cancelados, next.cancelados),
        assinantes: mesclarDicionario(base.assinantes, next.assinantes),
        lancamentos: Object.assign({}, base.lancamentos || {}, next.lancamentos || {}),
        uploads: unirPorId(base.uploads, next.uploads),
        uploadsCanc: unirPorId(base.uploadsCanc, next.uploadsCanc),
        uploadsAss: unirPorId(base.uploadsAss, next.uploadsAss),
        modelo: next.modelo || base.modelo || '',
        modelosResgate: (next.modelosResgate && next.modelosResgate.length === 3) ? next.modelosResgate : (base.modelosResgate || []),
        metas: Object.assign({}, base.metas || {}, next.metas || {}),
        seq: Math.max(base.seq || 0, next.seq || 0) + 1,
        criadoEm: base.criadoEm || next.criadoEm || '',
        atualizadoEm: next.atualizadoEm || base.atualizadoEm || ''
      };
      await kv.set('estado', merged);
      return res.status(200).json({ ok: true, seq: merged.seq });
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao gravar no KV: ' + (e.message || String(e)) });
    }
  }
  return res.status(405).json({ error: 'Método não permitido' });
}
