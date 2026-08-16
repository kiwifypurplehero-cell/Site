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
