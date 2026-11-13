/**
 * Auth Module - Dark-PLP
 * Client-side authentication with Web Crypto API (PBKDF2)
 * Passwords hashed with 100k iterations, SHA-256
 */

const USERS_KEY = 'darkplp_users';
const SESSION_KEY = 'darkplp_session';
const PBKDF2_ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256; // bits

/**
 * Generate a cryptographically secure random salt (16 bytes)
 * @returns {Promise<string>} Base64-encoded salt
 */
export async function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - Plain text password
 * @param {string} salt - Base64-encoded salt
 * @returns {Promise<string>} Base64-encoded hash
 */
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM
    },
    keyMaterial,
    KEY_LENGTH
  );

  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

/**
 * Verify a password against a hash using constant-time comparison
 * @param {string} password - Plain text password to verify
 * @param {string} salt - Base64-encoded salt
 * @param {string} hash - Base64-encoded expected hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, salt, hash) {
  const computedHash = await hashPassword(password, salt);

  // Constant-time comparison to prevent timing attacks
  const a = Uint8Array.from(atob(computedHash), c => c.charCodeAt(0));
  const b = Uint8Array.from(atob(hash), c => c.charCodeAt(0));

  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Get all users from localStorage
 * @returns {Object} Users object keyed by email hash
 */
function getUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save users to localStorage
 * @param {Object} users - Users object
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Get current session from localStorage
 * @returns {Object|null} Session object or null
 */
export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Save session to localStorage
 * @param {Object|null} session - Session object or null to clear
 */
function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Hash email for lookup key (PBKDF2 with fixed salt for deterministic lookup)
 * @param {string} email - User email
 * @returns {Promise<string>} Base64-encoded email hash
 */
async function hashEmail(email) {
  const encoder = new TextEncoder();
  const fixedSalt = encoder.encode('darkplp-email-salt-v1');
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(email.toLowerCase().trim()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fixedSalt, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    KEY_LENGTH
  );
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

/**
 * Register a new user
 * @param {string} username - Display username
 * @param {string} email - User email
 * @param {string} password - User password (min 8 chars)
 * @returns {Promise<Object>} Created session
 * @throws {Error} If email exists or validation fails
 */
export async function register(username, email, password) {
  if (!username || !username.trim()) throw new Error('Nome de usuário é obrigatório');
  if (!email || !email.includes('@')) throw new Error('Email inválido');
  if (!password || password.length < 8) throw new Error('Senha deve ter pelo menos 8 caracteres');

  const emailHash = await hashEmail(email);
  const users = getUsers();

  if (users[emailHash]) {
    throw new Error('Este email já está cadastrado');
  }

  const salt = await generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const now = new Date().toISOString();
  users[emailHash] = {
    emailHash,
    salt,
    passwordHash,
    profile: {
      username: username.trim(),
      avatar: '🎮',
      theme: 'system',
      createdAt: now
    }
  };
  saveUsers(users);

  const session = {
    userEmailHash: emailHash,
    isGuest: false,
    guestExpiresAt: null,
    loggedInAt: now
  };
  saveSession(session);

  return session;
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Created session
 * @throws {Error} If credentials invalid
 */
export async function login(email, password) {
  if (!email || !password) throw new Error('Email e senha são obrigatórios');

  const emailHash = await hashEmail(email);
  const users = getUsers();
  const user = users[emailHash];

  if (!user) throw new Error('Email ou senha incorretos');

  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) throw new Error('Email ou senha incorretos');

  const session = {
    userEmailHash: emailHash,
    isGuest: false,
    guestExpiresAt: null,
    loggedInAt: new Date().toISOString()
  };
  saveSession(session);

  return session;
}

/**
 * Logout current user
 */
export function logout() {
  saveSession(null);
}

/**
 * Create a guest session (30 minutes)
 * @returns {Object} Guest session
 */
export function createGuestSession() {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const session = {
    userEmailHash: null,
    isGuest: true,
    guestExpiresAt: expiresAt,
    loggedInAt: new Date().toISOString()
  };
  saveSession(session);
  return session;
}

/**
 * Check if guest session has expired
 * @param {Object} session - Session object
 * @returns {boolean} True if expired
 */
export function isGuestExpired(session) {
  if (!session || !session.isGuest || !session.guestExpiresAt) return false;
  return new Date() > new Date(session.guestExpiresAt);
}

/**
 * Get remaining time for guest session in milliseconds
 * @param {Object} session - Session object
 * @returns {number} Milliseconds remaining (0 if expired or not guest)
 */
export function getGuestTimeRemaining(session) {
  if (!session || !session.isGuest || !session.guestExpiresAt) return 0;
  const remaining = new Date(session.guestExpiresAt).getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Delete user account (requires password confirmation)
 * @param {string} email - User email
 * @param {string} password - User password for confirmation
 * @returns {Promise<boolean>} True if deleted
 * @throws {Error} If verification fails
 */
export async function deleteAccount(email, password) {
  const emailHash = await hashEmail(email);
  return deleteAccountByHash(emailHash, password);
}

/**
 * Delete user account by email hash (requires password confirmation)
 * @param {string} emailHash - Pre-computed email hash
 * @param {string} password - User password for confirmation
 * @returns {Promise<boolean>} True if deleted
 * @throws {Error} If verification fails
 */
export async function deleteAccountByHash(emailHash, password) {
  const users = getUsers();
  const user = users[emailHash];

  if (!user) throw new Error('Conta não encontrada');

  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) throw new Error('Senha incorreta');

  delete users[emailHash];
  saveUsers(users);
  saveSession(null);

  return true;
}

/**
 * Get current user profile (if logged in)
 * @returns {Object|null} Profile object or null
 */
export function getProfile() {
  const session = getSession();
  if (!session || session.isGuest) return null;

  const users = getUsers();
  const user = users[session.userEmailHash];
  return user?.profile || null;
}

/**
 * Update user profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(updates) {
  const session = getSession();
  if (!session || session.isGuest) throw new Error('Não autenticado');

  const users = getUsers();
  const user = users[session.userEmailHash];
  if (!user) throw new Error('Usuário não encontrado');

  user.profile = { ...user.profile, ...updates };
  saveUsers(users);

  return user.profile;
}