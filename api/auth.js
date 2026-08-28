import { kvDisponivel, kvGet, kvSet } from './_lib/kv.js';

const SEED = { savio: { nome: 'Sávio', senha: '123456', unidade: 'todas', perfil: 'admin' } };

function validar(usuarios, nome, unidade, senha) {
  const key = Object.keys(usuarios || {}).find(k => {
    const u = usuarios[k];
    const matchNome = (u.nome || '').trim().toLowerCase() === (nome || '').trim().toLowerCase();
    const matchSenha = String(u.senha) === String(senha);
    const matchUnidade = (u.unidade === 'todas' || u.unidade === unidade || unidade === 'todas' || u.perfil === 'admin' || u.perfil === 'gerente');
    return matchNome && matchSenha && matchUnidade;
  });
  return key ? { chave: key, ...usuarios[key] } : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { nome, unidade, senha } = req.body || {};
    if (!kvDisponivel()) {
      const u = validar(SEED, nome, unidade, senha);
      if (!u) return res.status(401).json({ error: 'Credenciais inválidas (modo local)' });
      return res.status(200).json({ chave: u.chave, nome: u.nome, unidade: u.unidade, perfil: u.perfil });
    }
    let usuarios = await kvGet('usuarios', null);
    if (!usuarios) { usuarios = SEED; await kvSet('usuarios', SEED); }
    const u = validar(usuarios, nome, unidade, senha);
    if (!u) return res.status(401).json({ error: 'Credenciais inválidas' });
    return res.status(200).json({ chave: u.chave, nome: u.nome, unidade: u.unidade, perfil: u.perfil });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno' });
  }
}
