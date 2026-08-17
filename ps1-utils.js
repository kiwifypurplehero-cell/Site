function decodePs1Key(key) {
  let decoded = String(key || '');
  // The API may return either the storage key or its URL-encoded form. Decode
  // encoded input before applying the one canonical encoding below.
  for (let pass = 0; pass < 2 && /%[\da-f]{2}/i.test(decoded); pass += 1) {
    try { decoded = decodeURIComponent(decoded); } catch { break; }
  }
  return decoded;
}

export function ps1StreamUrl(game) {
  return `/api/emulators/ps1/file/${encodeURIComponent(decodePs1Key(game.bootKey || game.key))}`;
}

export function resolvePs1Launch(game) {
  if (!game || typeof (game.bootKey || game.key) !== 'string') throw new TypeError('Jogo PS1 inválido.');
  const dependencies = (game.files || []).filter(file => file.key !== (game.bootKey || game.key)).map(file => ({...file, url: `/api/emulators/ps1/file/${encodeURIComponent(decodePs1Key(file.key))}`}));
  return {bootUrl: ps1StreamUrl(game), format: game.format, dependencies, coverUrl: game.coverUrl || null};
}

export class Ps1LibraryError extends Error {
  constructor(code, message) { super(message); this.name = 'Ps1LibraryError'; this.code = code; }
}

/** Resolve an opaque public game id through the library; storage keys never enter the page URL. */
export async function fetchPs1Game(gameId, {fetchImpl = fetch} = {}) {
  if (!gameId) throw new Ps1LibraryError('missing', 'Jogo não especificado');
  let response;
  try { response = await fetchImpl('/api/emulators/ps1/games'); }
  catch { throw new Ps1LibraryError('unavailable', 'Biblioteca temporariamente indisponível'); }
  if (!response?.ok) throw new Ps1LibraryError('unavailable', 'Biblioteca temporariamente indisponível');
  let payload;
  try { payload = await response.json(); }
  catch { throw new Ps1LibraryError('unavailable', 'Biblioteca temporariamente indisponível'); }
  if (!Array.isArray(payload?.games)) throw new Ps1LibraryError('unavailable', 'Biblioteca temporariamente indisponível');
  const game = payload.games.find(item => item?.id === gameId);
  if (!game) throw new Ps1LibraryError('not-found', 'Jogo não encontrado');
  return {game, count: payload.games.length};
}

const encoder = new TextEncoder();

function crc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    table[index] = value >>> 0;
  }
  return table;
}

const CRC32_TABLE = crc32Table();

async function blobCrc32(blob) {
  let crc = 0xffffffff;
  for await (const chunk of blob.stream()) {
    for (const byte of chunk) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipHeader(length, signature) {
  const bytes = new Uint8Array(length);
  new DataView(bytes.buffer).setUint32(0, signature, true);
  return {bytes, view: new DataView(bytes.buffer)};
}

function archivePath(key, directory) {
  const decoded = decodePs1Key(key).replace(/^\/+/, '');
  return decoded.startsWith(directory) ? decoded.slice(directory.length) : decoded.split('/').pop();
}

/** Build a store-only ZIP without copying the large BIN into another ArrayBuffer. */
export async function createPs1Archive(files) {
  if (!files.length) throw new TypeError('O conjunto de arquivos PS1 está vazio.');
  const bootKey = decodePs1Key(files[0].key);
  const slash = bootKey.lastIndexOf('/');
  const directory = slash < 0 ? '' : bootKey.slice(0, slash + 1);
  const parts = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(archivePath(file.key, directory));
    const size = file.blob.size;
    if (size > 0xffffffff || offset > 0xffffffff) throw new RangeError('Arquivo PS1 grande demais para o contêiner ZIP.');
    const crc = await blobCrc32(file.blob);
    const local = zipHeader(30, 0x04034b50);
    local.view.setUint16(4, 20, true); local.view.setUint16(6, 0x0800, true);
    local.view.setUint32(14, crc, true); local.view.setUint32(18, size, true); local.view.setUint32(22, size, true);
    local.view.setUint16(26, name.length, true);
    parts.push(local.bytes, name, file.blob);

    const entry = zipHeader(46, 0x02014b50);
    entry.view.setUint16(4, 20, true); entry.view.setUint16(6, 20, true); entry.view.setUint16(8, 0x0800, true);
    entry.view.setUint32(16, crc, true); entry.view.setUint32(20, size, true); entry.view.setUint32(24, size, true);
    entry.view.setUint16(28, name.length, true); entry.view.setUint32(42, offset, true);
    central.push(entry.bytes, name);
    offset += local.bytes.length + name.length + size;
  }

  const centralSize = central.reduce((total, part) => total + part.length, 0);
  const end = zipHeader(22, 0x06054b50);
  end.view.setUint16(8, files.length, true); end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, centralSize, true); end.view.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.bytes], {type: 'application/zip'});
}

function responseSize(response) {
  const range = response.headers.get('Content-Range')?.match(/\/(\d+)$/);
  const value = range?.[1] || response.headers.get('Content-Length');
  return /^\d+$/.test(value || '') ? Number(value) : null;
}

export class Ps1NetworkError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'Ps1NetworkError'; this.code = code; Object.assign(this, details); }
}

const sleep = (milliseconds, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, milliseconds);
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason || new DOMException('Aborted', 'AbortError')); }, {once: true});
});

function httpError(response, source) {
  const status = response.status;
  const expired = status === 401 || (status === 403 && /(?:X-Amz-(?:Expires|Date|Credential)|token|signature)/i.test(source.url));
  const code = expired ? 'SIGNED_URL_EXPIRED' : `HTTP_${status}`;
  const messages = {401: 'A autorização do arquivo expirou.', 403: 'O acesso ao arquivo foi recusado.', 404: 'O arquivo do jogo não foi encontrado.'};
  return new Ps1NetworkError(code, messages[status] || (status >= 500 ? 'O servidor de arquivos está temporariamente indisponível.' : `Falha HTTP ${status} ao baixar o jogo.`), {status});
}

async function timedFetch(fetchImpl, url, init, timeoutMs) {
  const timeout = new AbortController();
  const onAbort = () => timeout.abort(init.signal?.reason);
  if (init.signal?.aborted) onAbort();
  init.signal?.addEventListener('abort', onAbort, {once: true});
  const timer = setTimeout(() => timeout.abort(new Ps1NetworkError('NETWORK_TIMEOUT', 'A conexão demorou demais. Tente novamente.')), timeoutMs);
  try { return await fetchImpl(url, {...init, signal: timeout.signal}); }
  catch (error) {
    if (init.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (timeout.signal.aborted) throw timeout.signal.reason;
    if (error?.name === 'AbortError') throw error;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Ps1NetworkError('OFFLINE', 'Este dispositivo está sem conexão com a internet.');
    if (error instanceof TypeError) throw new Ps1NetworkError('CORS_OR_NETWORK', 'O navegador bloqueou ou perdeu a conexão com o servidor de arquivos.');
    throw new Ps1NetworkError('BACKEND_FAILURE', 'O serviço de arquivos (Backblaze/Worker) não respondeu corretamente.');
  } finally { clearTimeout(timer); init.signal?.removeEventListener('abort', onAbort); }
}

async function withRetries(operation, {signal, attempts = 3, onRetry} = {}) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(attempt); } catch (error) {
      last = error;
      if (error?.name === 'AbortError' || error?.status === 404 || (error?.status >= 400 && error?.status < 500 && error.code !== 'SIGNED_URL_EXPIRED') || attempt === attempts - 1) throw error;
      await onRetry?.(error, attempt + 1);
      await sleep(400 * (2 ** attempt), signal);
    }
  }
  throw last;
}

async function preflight(source, fetchImpl, signal, timeoutMs) {
  let head;
  try { head = await timedFetch(fetchImpl, source.url, {method: 'HEAD', signal}, timeoutMs); } catch (error) { if (error?.name === 'AbortError' || error?.code === 'OFFLINE' || error?.code === 'NETWORK_TIMEOUT') throw error; }
  if (head && (head.status === 200 || head.status === 206)) return responseSize(head);
  const range = await timedFetch(fetchImpl, source.url, {method: 'GET', headers: {Range: 'bytes=0-0'}, signal}, timeoutMs);
  if (range.status !== 200 && range.status !== 206) throw httpError(range, source);
  if (range.status === 200 && !range.headers.get('Accept-Ranges')) source.rangeUnsupported = true;
  await range.body?.cancel?.().catch(() => {});
  return responseSize(range);
}

async function downloadBlob(source, {fetchImpl, signal, onChunk, timeoutMs}) {
  const response = await timedFetch(fetchImpl, source.url, {signal}, timeoutMs);
  if (!response.ok) throw httpError(response, source);
  const total = responseSize(response);
  if (!response.body?.getReader) {
    const blob = await response.blob(); onChunk?.(blob.size, total || blob.size, source.key);
    return blob;
  }
  const reader = response.body.getReader(), chunks = [];
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value); onChunk?.(value.byteLength, total, source.key);
    }
  } catch (error) { await reader.cancel(error).catch(() => {}); throw error; }
  return new Blob(chunks, {type: response.headers.get('Content-Type') || 'application/octet-stream'});
}

/** Download every boot file once and expose the resulting Blob URL to EmulatorJS. */
export async function downloadPs1Content(game, {fetchImpl = fetch, signal, onMetadata, onProgress, onRetry, refreshSource, attempts = 3, timeoutMs = 20000} = {}) {
  const launch = resolvePs1Launch(game);
  const sources = [{key: game.bootKey || game.key, url: launch.bootUrl}, ...launch.dependencies];
  const sizes = await Promise.all(sources.map(source => withRetries(() => preflight(source, fetchImpl, signal, timeoutMs), {signal, attempts, onRetry: async (error, attempt) => {
    if (error.code === 'SIGNED_URL_EXPIRED' && refreshSource) source.url = await refreshSource(source);
    onRetry?.({error, attempt, key: source.key});
  }})));
  const knownTotal = sizes.every(Number.isFinite) ? sizes.reduce((sum, size) => sum + size, 0) : null;
  onMetadata?.({totalBytes: knownTotal, files: sources.map((source, index) => ({...source, size: sizes[index]}))});
  const files = [];
  let loadedBytes = 0;
  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    let attemptLoaded = 0;
    const blob = await withRetries(() => downloadBlob(source, {fetchImpl, signal, timeoutMs, onChunk(bytes, responseTotal, key) {
      loadedBytes += bytes; attemptLoaded += bytes;
      onProgress?.({loadedBytes, totalBytes: knownTotal, currentFile: key, fileTotal: sizes[index] || responseTotal});
    }}), {signal, attempts, onRetry: async (error, attempt) => {
      loadedBytes -= attemptLoaded; attemptLoaded = 0;
      if (error.code === 'SIGNED_URL_EXPIRED' && refreshSource) source.url = await refreshSource(source);
      onRetry?.({error, attempt, key: source.key});
    }});
    files.push({key: source.key, blob});
  }
  const content = launch.dependencies.length ? await createPs1Archive(files) : files[0].blob;
  return {...launch, gameUrl: URL.createObjectURL(content), archive: launch.dependencies.length ? content : null, blob: content, loadedBytes, totalBytes: knownTotal || loadedBytes};
}

export const downloadPs1Archive = downloadPs1Content;

function fetchFailure(error) {
  if (error?.name === 'AbortError') return {kind: 'abort', message: 'A verificação do arquivo foi cancelada ou excedeu o tempo limite.'};
  if (error instanceof TypeError) return {kind: 'network-or-cors', message: 'O navegador não concluiu a verificação (rede ou CORS).'};
  return {kind: 'invalid-response', message: 'A verificação retornou uma resposta inválida.'};
}

function responseDetails(method, requestedUrl, response) {
  return {
    method,
    requestedUrl,
    finalUrl: response.url || requestedUrl,
    status: response.status,
    statusText: response.statusText,
    contentLength: response.headers.get('Content-Length'),
    acceptRanges: response.headers.get('Accept-Ranges')
  };
}

export async function inspectPs1File(gameUrl, {signal, fetchImpl = fetch, log = console.log} = {}) {
  const attempts = [];
  const request = async (method, init) => {
    try {
      const response = await fetchImpl(gameUrl, {...init, signal});
      if (!response || typeof response.status !== 'number' || !response.headers) throw new Error('invalid response');
      const details = responseDetails(method, gameUrl, response);
      attempts.push(details);
      log('[PS1] file check:', details);
      return {response, details};
    } catch (error) {
      const failure = {...fetchFailure(error), method, requestedUrl: gameUrl};
      attempts.push(failure);
      log('[PS1] file check:', failure);
      return {failure};
    }
  };

  const head = await request('HEAD', {method: 'HEAD'});
  if (head.response?.ok) return {ok: true, attempts, details: head.details};

  const range = await request('GET', {method: 'GET', headers: {Range: 'bytes=0-0'}});
  if (range.response && (range.response.status === 200 || range.response.status === 206)) {
    return {ok: true, attempts, details: range.details};
  }
  // A browser-level failure is not proof that the file is forbidden. Let
  // EmulatorJS make its own simple request and report its real loader error.
  if (range.failure) return {ok: null, attempts, warning: range.failure};
  return {ok: false, attempts, details: range.details};
}
