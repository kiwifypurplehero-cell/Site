/**
 * Storage Utilities - localStorage wrapper with JSON, namespace, TTL
 */

const NAMESPACE = 'xpgd_';
const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getKey(key) {
  return `${NAMESPACE}${key}`;
}

function isExpired(item) {
  if (!item.expiresAt) return false;
  return Date.now() > item.expiresAt;
}

export function get(key, fallback = null) {
  try {
    const item = localStorage.getItem(getKey(key));
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (isExpired(parsed)) {
      remove(key);
      return fallback;
    }
    return parsed.value;
  } catch (e) {
    console.warn(`Storage get error for ${key}:`, e);
    return fallback;
  }
}

export function set(key, value, ttl = DEFAULT_TTL) {
  try {
    const item = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : null,
    };
    localStorage.setItem(getKey(key), JSON.stringify(item));
    return true;
  } catch (e) {
    console.warn(`Storage set error for ${key}:`, e);
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(getKey(key));
    return true;
  } catch (e) {
    console.warn(`Storage remove error for ${key}:`, e);
    return false;
  }
}

export function clear() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(NAMESPACE))
      .forEach(k => localStorage.removeItem(k));
    return true;
  } catch (e) {
    console.warn('Storage clear error:', e);
    return false;
  }
}

export function getAll(prefix = '') {
  const results = {};
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${NAMESPACE}${prefix}`))
      .forEach(k => {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          if (!isExpired(parsed)) {
            results[k.replace(`${NAMESPACE}${prefix}`, '')] = parsed.value;
          }
        }
      });
  } catch (e) {
    console.warn('Storage getAll error:', e);
  }
  return results;
}

export function has(key) {
  return get(key) !== null;
}

export function keys(prefix = '') {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(`${NAMESPACE}${prefix}`))
    .map(k => k.replace(`${NAMESPACE}${prefix}`, ''));
}

export function size() {
  let total = 0;
  Object.keys(localStorage)
    .filter(k => k.startsWith(NAMESPACE))
    .forEach(k => { total += localStorage.getItem(k).length; });
  return total;
}

// Migration helper
export function migrate(oldNamespace, newNamespace = NAMESPACE) {
  const migrated = [];
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(oldNamespace))
      .forEach(oldKey => {
        const newKey = newNamespace + oldKey.slice(oldNamespace.length);
        const value = localStorage.getItem(oldKey);
        if (value) {
          localStorage.setItem(newKey, value);
          localStorage.removeItem(oldKey);
          migrated.push({ old: oldKey, new: newKey });
        }
      });
  } catch (e) {
    console.warn('Storage migration error:', e);
  }
  return migrated;
}

// Settings-specific helpers
export const settings = {
  get: (key, fallback) => get(`settings.${key}`, fallback),
  set: (key, value) => set(`settings.${key}`, value, null), // No TTL for settings
  remove: (key) => remove(`settings.${key}`),
  getAll: () => getAll('settings.'),
  clear: () => {
    keys('settings.').forEach(k => remove(`settings.${k}`));
  },
};

// Cache-specific helpers (with TTL)
export const cache = {
  get: (key, fallback) => get(`cache.${key}`, fallback),
  set: (key, value, ttl = 5 * 60 * 1000) => set(`cache.${key}`, value, ttl), // 5 min default
  remove: (key) => remove(`cache.${key}`),
  clear: () => {
    keys('cache.').forEach(k => remove(`cache.${k}`));
  },
};

// User preferences
export const preferences = {
  get: (key, fallback) => get(`prefs.${key}`, fallback),
  set: (key, value) => set(`prefs.${key}`, value, null),
  remove: (key) => remove(`prefs.${key}`),
};

// Session storage (for temporary data)
export const session = {
  get: (key, fallback = null) => {
    try {
      const item = sessionStorage.getItem(getKey(key));
      return item ? JSON.parse(item) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try {
      sessionStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove: (key) => {
    try {
      sessionStorage.removeItem(getKey(key));
      return true;
    } catch { return false; }
  },
  clear: () => {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(NAMESPACE))
      .forEach(k => sessionStorage.removeItem(k));
  },
};

export default { get, set, remove, clear, getAll, has, keys, size, migrate, settings, cache, preferences, session };