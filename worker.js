const SESSION_SECONDS = 2 * 60 * 60;
const MAX_BODY_BYTES = 4096;
const attempts = new Map();
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
function normalizeUsername(value) { return String(value || '').trim().toLowerCase(); }
function validUsername(value) { return /^[a-z0-9._-]{3,24}$/.test(value); }
function bytesToBase64(bytes) { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
function safeEqual(a, b) { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]; return result === 0; }
async function hmac(value, secret) { const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))); }
async function passwordMatches(password, stored) {
  const [algorithm, roundsText, saltText, expectedText] = String(stored || '').split('$');
  const rounds = Number(roundsText);
  if (algorithm !== 'pbkdf2-sha256' || !Number.isInteger(rounds) || rounds < 100000 || rounds > 1000000) return false;
  try { const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(saltText), iterations: rounds }, material, 256); return safeEqual(new Uint8Array(bits), base64ToBytes(expectedText)); } catch { return false; }
}
function cookie(request, name) { const match = request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)); return match?.[1] || ''; }
async function createSession(env) { const payload = bytesToBase64(encoder.encode(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS, nonce: bytesToBase64(crypto.getRandomValues(new Uint8Array(24))) }))); return `${payload}.${bytesToBase64(await hmac(payload, env.SESSION_SECRET))}`; }
export async function requireAdminSession(request, env) {
  const raw = cookie(request, '__Host-plump_admin'); const dot = raw.lastIndexOf('.');
  if (dot < 1 || !env.SESSION_SECRET) return false;
  try { const payload = raw.slice(0, dot), signature = base64ToBytes(raw.slice(dot + 1)); if (!safeEqual(signature, await hmac(payload, env.SESSION_SECRET))) return false; const data = JSON.parse(new TextDecoder().decode(base64ToBytes(payload))); return data.role === 'admin' && Number(data.exp) > Date.now() / 1000; } catch { return false; }
}
function rateKey(request) { return request.headers.get('CF-Connecting-IP') || 'local'; }
function limited(request) { const key = rateKey(request), now = Date.now(), recent = (attempts.get(key) || []).filter(t => now - t < 15 * 60 * 1000); attempts.set(key, recent); return recent.length >= 8; }
function recordFailure(request) { const key = rateKey(request); attempts.set(key, [...(attempts.get(key) || []), Date.now()].slice(-8)); }
async function login(request, env) {
  if (limited(request)) return json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Content-Type deve ser application/json.' }, 415);
  const length = Number(request.headers.get('Content-Length') || 0); if (length > MAX_BODY_BYTES) return json({ error: 'Requisição muito grande.' }, 413);
  let body; try { const text = await request.text(); if (encoder.encode(text).length > MAX_BODY_BYTES) return json({ error: 'Requisição muito grande.' }, 413); body = JSON.parse(text); } catch { return json({ error: 'JSON inválido.' }, 400); }
  const username = normalizeUsername(body.username), password = typeof body.password === 'string' ? body.password : '';
  const usernameOk = validUsername(username) && env.ADMIN_USERNAME && safeEqual(encoder.encode(username), encoder.encode(normalizeUsername(env.ADMIN_USERNAME)));
  const passwordOk = password && await passwordMatches(password, env.ADMIN_PASSWORD_HASH);
  if (!usernameOk || !passwordOk) { recordFailure(request); return json({ error: 'Usuário ou senha inválidos.' }, 401); }
  attempts.delete(rateKey(request)); const token = await createSession(env);
  return json({ authenticated: true, role: 'admin' }, 200, { 'Set-Cookie': `__Host-plump_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}` });
}
async function api(request, env, path) {
  if (path === '/api/admin/login' && request.method === 'POST') return login(request, env);
  if (path === '/api/admin/logout' && request.method === 'POST') return json({ authenticated: false }, 200, { 'Set-Cookie': '__Host-plump_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' });
  if (path === '/api/admin/session' && request.method === 'GET') return await requireAdminSession(request, env) ? json({ authenticated: true, role: 'admin' }) : json({ authenticated: false });
  if (path.startsWith('/api/admin/')) { if (!await requireAdminSession(request, env)) return json({ error: 'Não autorizado.' }, 401); return json({ error: 'Endpoint administrativo não implementado.' }, 404); }
  return json({ error: 'Não encontrado.' }, 404);
}
export default { async fetch(request, env) { const url = new URL(request.url); if (url.pathname.startsWith('/api/')) return api(request, env, url.pathname); let response = await env.ASSETS.fetch(request); if (response.status === 404 && request.method === 'GET' && request.headers.get('Accept')?.includes('text/html')) response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request)); return response; } };
