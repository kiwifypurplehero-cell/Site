const cache = new Map();
const pending = new Map();
const lastRefresh = new Map();
const CACHE_TTL = 60_000;
const REFRESH_COOLDOWN = 1_500;
const BATCH_SIZE = 30;

const idle = callback => globalThis.requestIdleCallback
  ? requestIdleCallback(callback, {timeout: 250})
  : setTimeout(() => callback({timeRemaining: () => 8}), 0);

export function clearLibraryCache(system) { cache.delete(system); }

export async function fetchEmulatorLibrary(system, {forceRefresh = false, fetchImpl = fetch, now = Date.now} = {}) {
  const started = performance.now();
  const cached = cache.get(system);
  console.debug(`[LIBRARY] loading system=${system}`);
  console.debug(`[LIBRARY] forceRefresh=${forceRefresh}`);
  if (!forceRefresh && cached && now() - cached.storedAt < CACHE_TTL) {
    console.debug('[LIBRARY] cache=hit');
    return cached.payload;
  }
  if (!forceRefresh && pending.has(system)) return pending.get(system);
  console.debug('[LIBRARY] cache=miss');
  const timestamp = now();
  const url = `/api/emulators/${encodeURIComponent(system)}/games${forceRefresh ? `?refresh=${timestamp}` : ''}`;
  const operation = (async () => {
    const response = await fetchImpl(url, {
      cache: forceRefresh ? 'no-store' : 'default',
      headers: {Accept: 'application/json', ...(forceRefresh ? {'Cache-Control': 'no-cache'} : {})}
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Não foi possível atualizar a biblioteca.');
    cache.set(system, {payload, storedAt: now()});
    console.debug(`[LIBRARY] objects=${payload.games?.length || 0}`);
    console.debug(`[LIBRARY] duration=${Math.round(performance.now() - started)}ms`);
    return payload;
  })();
  if (!forceRefresh) pending.set(system, operation);
  try { return await operation; } finally { if (pending.get(system) === operation) pending.delete(system); }
}

export function renderLibraryIncrementally(list, games, createCard, {batchSize = BATCH_SIZE} = {}) {
  const fragment = document.createDocumentFragment();
  const staging = document.createElement('div');
  let index = 0;
  const done = new Promise(resolve => {
    const appendBatch = deadline => {
      let count = 0;
      while (index < games.length && count++ < batchSize && deadline.timeRemaining() > 1) fragment.append(createCard(games[index++]));
      staging.append(fragment);
      if (index < games.length) idle(appendBatch);
      else { list.replaceChildren(...staging.childNodes); console.debug(`[LIBRARY] rendered=${index}`); resolve(); }
    };
    idle(appendBatch);
  });
  return done;
}

export async function refreshLibraryButton(system, button, load) {
  const elapsed = Date.now() - (lastRefresh.get(system) || 0);
  if (button.disabled || elapsed < REFRESH_COOLDOWN) return false;
  lastRefresh.set(system, Date.now());
  button.disabled = true;
  button.textContent = 'Atualizando...';
  try {
    await load({forceRefresh: true});
    button.textContent = 'Biblioteca atualizada';
    setTimeout(() => { button.textContent = 'Atualizar biblioteca'; button.disabled = false; }, 900);
    return true;
  } catch (error) {
    button.textContent = 'Tentar novamente';
    button.disabled = false;
    throw error;
  }
}
