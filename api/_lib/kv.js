import { kv } from '@vercel/kv';

export function kvDisponivel() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function kvGet(key, fallback) {
  if (!kvDisponivel()) return fallback;
  try {
    const v = await kv.get(key);
    return (v === null || v === undefined) ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

export async function kvSet(key, value) {
  if (!kvDisponivel()) return false;
  try {
    await kv.set(key, value);
    return true;
  } catch (e) {
    return false;
  }
}
