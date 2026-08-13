(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlumpPlay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const OWNER = 'kiwifypurplehero-cell';
  const PLAY_HOST = `${OWNER}.github.io`;
  const KNOWN_GAMES = Object.freeze({
    fnf: Object.freeze({ repo:'FNF', name:'FNF', url:`https://${PLAY_HOST}/FNF/` }),
    'cs1-6html': Object.freeze({ repo:'CS1-6HTML', name:'CS 1.6 PLH', url:`https://${PLAY_HOST}/CS1-6HTML/` })
  });
  const FIXED_RESOLUTIONS = Object.freeze([
    '1920x1080', '1600x900', '1366x768', '1280x720', '1280x1024',
    '1280x960', '1024x768', '800x600', '640x480'
  ]);
  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 240;
  const MAX_WIDTH = 7680;
  const MAX_HEIGHT = 4320;

  function repositoryName(game) {
    return String(game?.repo || game?.rawName || game?.name || '').trim();
  }

  function validRepositoryName(repo) {
    return /^[A-Za-z0-9._-]{1,100}$/.test(repo) && repo !== '.' && repo !== '..';
  }

  function getGamePlayUrl(game) {
    const repo = repositoryName(game);
    const known = KNOWN_GAMES[repo.toLowerCase()];
    if (known) return known.url;
    if (!validRepositoryName(repo)) return '';
    const candidate = new URL(`https://${PLAY_HOST}/${encodeURIComponent(repo)}/`);
    return candidate.protocol === 'https:' && candidate.hostname === PLAY_HOST ? candidate.href : '';
  }

  function buildPlayPageUrl(game, baseUrl) {
    const repo = repositoryName(game);
    if (!getGamePlayUrl({ repo })) return '';
    const url = new URL('/play.html', baseUrl);
    url.searchParams.set('repo', repo);
    const name = String(game?.name || repo).trim().slice(0, 100);
    if (name) url.searchParams.set('name', name);
    return url.href;
  }

  function parseResolution(value) {
    const match = /^(\d+)x(\d+)$/.exec(String(value));
    return match ? { width:Number(match[1]), height:Number(match[2]) } : null;
  }

  function validCustomResolution(width, height) {
    return Number.isInteger(width) && Number.isInteger(height) &&
      width >= MIN_WIDTH && width <= MAX_WIDTH && height >= MIN_HEIGHT && height <= MAX_HEIGHT;
  }

  function fitResolution(availableWidth, availableHeight, targetWidth, targetHeight) {
    if (![availableWidth, availableHeight, targetWidth, targetHeight].every(Number.isFinite) ||
        availableWidth <= 0 || availableHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) return null;
    return {
      width:targetWidth,
      height:targetHeight,
      scale:Math.min(availableWidth / targetWidth, availableHeight / targetHeight)
    };
  }

  return {
    OWNER, PLAY_HOST, KNOWN_GAMES, FIXED_RESOLUTIONS,
    MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT,
    repositoryName, validRepositoryName, getGamePlayUrl, buildPlayPageUrl,
    parseResolution, validCustomResolution, fitResolution
  };
});
