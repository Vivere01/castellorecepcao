import { kvDisponivel, kvGet, kvSet } from './_lib/kv.js';

const SEED = { savio: { nome: 'Sávio', senha: '123456', unidade: 'todas', perfil: 'admin' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    if (!kvDisponivel()) return res.status(200).json(SEED);
    let usuarios = await kvGet('usuarios', null);
    if (!usuarios) { usuarios = SEED; await kvSet('usuarios', SEED); }
    return res.status(200).json(usuarios);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (body.pedidoPor !== 'admin') return res.status(403).json({ error: 'Apenas administradores' });
    if (body.op === 'replace' && body.usuarios) {
      if (!kvDisponivel()) return res.status(200).json({ ok: true });
      await kvSet('usuarios', body.usuarios);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Operação inválida' });
  }
  return res.status(405).json({ error: 'Método não permitido' });
}
