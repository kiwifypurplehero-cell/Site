const SESSION_COOKIE = '__Host-plump_session';
const SESSION_SECONDS = 12 * 60 * 60;
const REMEMBER_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 16 * 1024;
const PBKDF2_ITERATIONS = 210000;
const encoder = new TextEncoder();
const attempts = new Map();

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const normalizeUsername = value => String(value || '').trim().toLowerCase();
const validUsername = value => /^[a-z0-9._-]{3,24}$/.test(value);
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const toHex = bytes => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
const toBase64 = bytes => btoa(String.fromCharCode(...bytes));
const fromBase64 = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const publicUser = user => ({ username: user.username, displayName: user.display_name, avatar: user.avatar, role: user.role });

async function sha256(value) {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, material, 256);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}
async function passwordMatches(password, stored) {
  const [algorithm, rounds, salt, expected] = String(stored || '').split('$');
  if (algorithm !== 'pbkdf2-sha256' || Number(rounds) !== PBKDF2_ITERATIONS) return false;
  try {
    const actual = await hashPassword(password, fromBase64(salt));
    const actualBytes = encoder.encode(actual);
    const expectedBytes = encoder.encode(stored);
    if (actualBytes.length !== expectedBytes.length) return false;
    let difference = 0;
    for (let index = 0; index < actualBytes.length; index++) difference |= actualBytes[index] ^ expectedBytes[index];
    return difference === 0 && actual.endsWith(expected);
  } catch { return false; }
}
function getCookie(request, name) {
  const match = request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}
function sessionCookie(token, persistent = false) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/${persistent ? `; Max-Age=${REMEMBER_SECONDS}` : ''}`;
}
const clearCookie = () => `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;

async function parseJson(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw Object.assign(new Error('Content-Type inválido.'), { status: 415 });
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) throw Object.assign(new Error('Requisição muito grande.'), { status: 413 });
  const text = await request.text();
  if (encoder.encode(text).length > MAX_BODY_BYTES) throw Object.assign(new Error('Requisição muito grande.'), { status: 413 });
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}
function rateKey(request, username = '') { return `${request.headers.get('CF-Connecting-IP') || 'local'}:${username}`; }
function isLimited(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000);
  attempts.set(key, recent);
  return recent.length >= 8;
}
function recordFailure(key) { attempts.set(key, [...(attempts.get(key) || []), Date.now()].slice(-8)); }

async function findSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !env.DB) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`SELECT u.id, u.username, u.display_name, u.avatar, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')`).bind(tokenHash).first();
  if (!row) return null;
  return { tokenHash, user: row };
}
async function createSession(env, userId, remember) {
  const token = toBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  const lifetime = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))")
    .bind(await sha256(token), userId, `+${lifetime} seconds`).run();
  return token;
}

async function login(request, env) {
  const body = await parseJson(request);
  const username = normalizeUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const key = rateKey(request, username);
  if (isLimited(key)) return json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429);
  if (!validUsername(username) || !password) return json({ error: 'Usuário ou senha inválidos.' }, 401);
  const user = await env.DB.prepare('SELECT id, username, password_hash, display_name, avatar, role FROM users WHERE username = ?').bind(username).first();
  if (!user || !await passwordMatches(password, user.password_hash)) {
    recordFailure(key);
    return json({ error: 'Usuário ou senha inválidos.' }, 401);
  }
  attempts.delete(key);
  const remember = body.remember === true;
  const token = await createSession(env, user.id, remember);
  return json({ authenticated: true, user: publicUser(user) }, 200, { 'Set-Cookie': sessionCookie(token, remember) });
}
async function register(request, env) {
  const body = await parseJson(request);
  const username = normalizeUsername(body.username);
  const email = String(body.email || '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName = String(body.displayName || '').trim().slice(0, 40);
  const allowedAvatars = ['controller', 'rocket', 'alien', 'bolt'];
  const avatar = allowedAvatars.includes(body.avatar) ? body.avatar : 'controller';
  if (!validUsername(username)) return json({ error: 'Nome de usuário inválido.' }, 400);
  if (!validEmail(email)) return json({ error: 'E-mail inválido.' }, 400);
  if (password.length < 8 || password.length > 128) return json({ error: 'A senha deve ter entre 8 e 128 caracteres.' }, 400);
  if (!displayName) return json({ error: 'Informe um nome de exibição.' }, 400);
  if (await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first()) return json({ error: 'Este nome de usuário já está em uso.' }, 409);
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return json({ error: 'Este e-mail já está cadastrado.' }, 409);
  const passwordHash = await hashPassword(password);
  const userResult = await env.DB.prepare(`INSERT INTO users
    (username, email, password_hash, display_name, avatar, bio, is_public, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`)
    .bind(username, email, passwordHash, displayName, avatar, String(body.bio || '').trim().slice(0, 160), body.isPublic === false ? 0 : 1).run();
  const userId = userResult.meta.last_row_id;
  const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : {};
  await env.DB.prepare(`INSERT INTO user_preferences
    (user_id, theme, wallpaper, animations, view_mode, reduce_motion)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(userId, String(preferences.theme || 'original').slice(0, 24), String(preferences.wallpaper || 'cosmic').slice(0, 24), preferences.animations === false ? 0 : 1, preferences.view === 'compact' ? 'compact' : 'detailed', preferences.reduceMotion === true ? 1 : 0).run();
  const user = { id: userId, username, display_name: displayName, avatar, role: 'user' };
  const token = await createSession(env, userId, body.remember === true);
  return json({ authenticated: true, user: publicUser(user) }, 201, { 'Set-Cookie': sessionCookie(token, body.remember === true) });
}
async function logout(request, env) {
  const session = await findSession(request, env);
  if (session) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
  return json({ authenticated: false }, 200, { 'Set-Cookie': clearCookie() });
}
async function session(request, env) {
  const current = await findSession(request, env);
  return current ? json({ authenticated: true, user: publicUser(current.user) }) : json({ authenticated: false });
}

export async function requireAdminSession(request, env) {
  const current = await findSession(request, env);
  if (!current) return { ok: false, response: json({ error: 'Autenticação necessária.' }, 401) };
  if (current.user.role !== 'admin') return { ok: false, response: json({ error: 'Permissão de administrador necessária.' }, 403) };
  return { ok: true, session: current };
}
async function adminRoute(request, env) {
  const authorization = await requireAdminSession(request, env);
  if (!authorization.ok) return authorization.response;
  return json({ ok: true, message: 'Sessão administrativa válida.' });
}
async function api(request, env, path) {
  try {
    if (!env.DB) return json({ error: 'Banco de dados não configurado.' }, 503);
    if (path === '/api/auth/login' && request.method === 'POST') return await login(request, env);
    if (path === '/api/auth/register' && request.method === 'POST') return await register(request, env);
    if (path === '/api/auth/logout' && request.method === 'POST') return await logout(request, env);
    if (path === '/api/auth/session' && request.method === 'GET') return await session(request, env);
    if (path.startsWith('/api/admin/')) return await adminRoute(request, env);
    return json({ error: 'Não encontrado.' }, 404);
  } catch (error) {
    if (error?.status) return json({ error: error.message }, error.status);
    return json({ error: 'Não foi possível conectar ao servidor.' }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, url.pathname);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.method === 'GET' && request.headers.get('Accept')?.includes('text/html')) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }
    return response;
  }
};
