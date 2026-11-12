/**
 * Games module
 * Handles fetching, caching, and rendering games from GitHub and community
 */

import { getGamePlayUrl, buildPlayPageUrl } from '../../play-utils.js';

const GITHUB_REPOSITORIES_URL = 'https://api.github.com/users/kiwifypurplehero-cell/repos?per_page=100&sort=updated';
const GAMES_CACHE_KEY = 'plumpgamesGithubReposCache';
const GAMES_CACHE_TTL = 5 * 60 * 1000;

const IGNORED_REPOSITORIES = ['site'];

const GAME_NAME_OVERRIDES = Object.freeze({
  'cs1-6html': 'CS 1.6 PLH'
});

const PLAYABLE_REPOSITORIES = {
  fnf: { name: 'FNF', playUrl: 'https://kiwifypurplehero-cell.github.io/FNF/' },
  'cs1-6html': { name: 'CS 1.6 PLH', playUrl: 'https://kiwifypurplehero-cell.github.io/CS1-6HTML/' }
};

function isSafeHttpsUrl(value, allowedHost) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!allowedHost || url.hostname === allowedHost);
  } catch { return false; }
}

function formatRepositoryName(name) {
  const acronyms = new Set(['html', 'css', 'js', 'api', 'vr', 'plh']);
  return String(name || '')
    .replace(/([a-zà-ÿ])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-zÀ-ÿ])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-zÀ-ÿ])/g, '$1 $2')
    .replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(Boolean)
    .map(word => acronyms.has(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLocaleLowerCase('pt-BR'))
    .join(' ');
}

function getGameDisplayName(repo) {
  const rawName = String(repo?.name || repo?.rawName || '');
  const override = GAME_NAME_OVERRIDES[rawName.toLowerCase()];
  const projectMetadataName = repo?.gameMetadata?.name || repo?.metadata?.gameName;
  const manifestName = repo?.plumpgame?.name || repo?.plumpgameJson?.name;
  const localTitle = repo?.displayName || repo?.localTitle || repo?.title;
  return [projectMetadataName, manifestName, localTitle, override, formatRepositoryName(rawName)]
    .find(value => typeof value === 'string' && value.trim())?.trim() || 'Jogo sem nome';
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date).replace(',', ' às');
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Atualização não informada';
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Atualizado agora';
  if (minutes < 60) return `Atualizado há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Atualizado há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  return `Atualizado há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function shouldIgnoreRepository(repo) {
  const name = typeof repo?.name === 'string' ? repo.name.toLowerCase() : '';
  return !name || repo.fork === true || repo.archived === true || repo.private === true ||
    IGNORED_REPOSITORIES.some(ignored => ignored.toLowerCase() === name);
}

function filterRepositories(repositories) {
  if (!Array.isArray(repositories)) return [];
  return repositories.filter(repo => repo && typeof repo === 'object' && !shouldIgnoreRepository(repo));
}

function getGitHubPagesUrl(repo) {
  const name = String(repo?.rawName || repo?.name || '').trim();
  return name ? `https://kiwifypurplehero-cell.github.io/${encodeURIComponent(name)}/` : '';
}

function normalizeRepository(repo) {
  const repositoryUrl = isSafeHttpsUrl(repo.html_url, 'github.com') ? repo.html_url : '';
  const fullName = typeof repo.full_name === 'string' ? repo.full_name : '';
  const branch = typeof repo.default_branch === 'string' && repo.default_branch.trim() ? repo.default_branch : '';
  let downloadUrl = '';
  if (/^[\w.-]+\/[\w.-]+$/.test(fullName) && branch) {
    const candidate = `https://github.com/${fullName}/archive/refs/heads/${encodeURIComponent(branch)}.zip`;
    if (isSafeHttpsUrl(candidate, 'github.com')) downloadUrl = candidate;
  }
  const rawName = String(repo.name || '');
  const playableConfig = PLAYABLE_REPOSITORIES[rawName.toLowerCase()];
  return {
    id: String(repo.id ?? fullName),
    name: getGameDisplayName({ ...repo, gameMetadata: playableConfig }),
    rawName,
    description: typeof repo.description === 'string' && repo.description.trim() ? repo.description.trim() : 'Projeto disponível na PlumpGames.',
    language: typeof repo.language === 'string' && repo.language.trim() ? repo.language : 'Não informada',
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    branch: branch || 'Não informada',
    status: 'Disponível',
    repositoryUrl,
    downloadUrl,
    playUrl: playableConfig?.playUrl || getGitHubPagesUrl({ rawName }),
    stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
    forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0,
    size: Number.isFinite(repo.size) ? repo.size : 0
  };
}

function repositoriesToGames(repositories) {
  return filterRepositories(repositories).map(normalizeRepository).sort((a, b) => {
    const dateDifference = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return dateDifference || a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  });
}

function loadGamesCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(GAMES_CACHE_KEY) || 'null');
    if (!cache || !Array.isArray(cache.repositories) || !Number.isFinite(cache.savedAt)) return null;
    return { ...cache, valid: Date.now() - cache.savedAt < GAMES_CACHE_TTL };
  } catch { return null; }
}

function saveGamesCache(repositories) {
  try {
    localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), repositories }));
  } catch (error) {
    console.warn('Não foi possível salvar o cache de jogos.', error);
  }
}

async function fetchRepositories() {
  const response = await fetch(GITHUB_REPOSITORIES_URL, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) {
    const error = new Error(response.status === 403 ? 'Limite de consultas do GitHub atingido.' : 'Falha ao consultar o GitHub.');
    error.status = response.status;
    throw error;
  }
  const repositories = await response.json();
  if (!Array.isArray(repositories)) throw new Error('Resposta inesperada do GitHub.');
  return repositories;
}

function normalizeCommunityGame(game) {
  return {
    ...game,
    id: `community-${game.id}`,
    community: true,
    status: 'COMUNIDADE',
    rawName: game.githubRepo,
    repositoryUrl: game.githubUrl,
    playUrl: game.playUrl || '',
    coverUrl: game.coverUrl || '',
    language: game.language || 'Não informada',
    branch: '—',
    downloadUrl: '',
    updatedAt: game.updatedAt,
    createdAt: game.createdAt,
    stars: Number(game.stars) || 0,
    forks: 0,
    size: 0
  };
}

export class GamesManager {
  constructor() {
    this.officialGames = [];
    this.communityGames = [];
    this.currentGames = [];
    this.refreshInProgress = false;
    this.gamesLoadingStarted = false;
    this.gameLibrary = null;
    this.createGameCardFn = null;
    this.onModeChange = null;
  }

  setCreateGameCard(fn) {
    this.createGameCardFn = fn;
  }

  setOnModeChange(fn) {
    this.onModeChange = fn;
  }

  async init(preferences) {
    // Set up library view when available
    if (window.GameLibraryView && this.createGameCardFn) {
      const list = document.querySelector('#games-list');
      if (list) {
        this.gameLibrary = new GameLibraryView(list, {
          mode: preferences.view,
          createItem: this.createGameCardFn,
          onModeChange: mode => {
            preferences.view = mode;
            this.onModeChange?.(mode);
          }
        });
      }
    }

    // Load cached games immediately
    const cache = loadGamesCache();
    if (cache) {
      this.officialGames = repositoriesToGames(cache.repositories);
      this.renderAllGames();
      this.renderSiteUpdate(cache.repositories);
    }

    // Start loading if authenticated
    if (window.plumpUser) {
      this.startLoading();
    } else {
      window.addEventListener('plumpgames:authenticated', () => this.startLoading(), { once: true });
    }
  }

  startLoading() {
    if (this.gamesLoadingStarted) return;
    this.gamesLoadingStarted = true;
    this.loadGitHubGames();
    this.loadCommunityGames();
  }

  async loadGitHubGames() {
    const cache = loadGamesCache();
    if (cache?.valid && !this.officialGames.length) {
      this.officialGames = repositoriesToGames(cache.repositories);
      this.renderAllGames();
      this.renderSiteUpdate(cache.repositories);
    }
    return this.refreshGames(false);
  }

  async refreshGames(force = false) {
    if (this.refreshInProgress) return;
    const cache = loadGamesCache();
    if (!force && cache?.valid) {
      this.officialGames = repositoriesToGames(cache.repositories);
      this.renderAllGames();
      this.renderSiteUpdate(cache.repositories);
      return;
    }
    this.refreshInProgress = true;
    const refreshBtn = document.querySelector('#refresh-games');
    if (refreshBtn) refreshBtn.disabled = true;
    if (!cache) this.setGamesMessage('Carregando jogos da PlumpGames…');
    try {
      const repositories = await fetchRepositories();
      saveGamesCache(repositories);
      this.officialGames = repositoriesToGames(repositories);
      this.renderAllGames();
      this.renderSiteUpdate(repositories);
    } catch (error) {
      if (cache) {
        this.officialGames = repositoriesToGames(cache.repositories);
        this.renderAllGames();
        this.renderSiteUpdate(cache.repositories);
      }
      this.showLoadFailure(Boolean(cache), error.status === 403);
    } finally {
      this.refreshInProgress = false;
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  async loadCommunityGames() {
    try {
      const response = await fetch('/api/community-games', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(String(response.status));
      const payload = await response.json();
      this.communityGames = Array.isArray(payload.games) ? payload.games.map(normalizeCommunityGame) : [];
      const msg = document.querySelector('#community-message');
      if (msg) msg.hidden = true;
      this.renderAllGames();
    } catch (error) {
      console.warn('Community catalog unavailable', error);
      const msg = document.querySelector('#community-message');
      if (msg) {
        msg.textContent = 'Não foi possível carregar os jogos da comunidade agora.';
        msg.hidden = false;
      }
    }
  }

  renderAllGames() {
    this.currentGames = [...this.officialGames, ...this.communityGames];
    this.renderGames(this.currentGames);
  }

  renderGames(games) {
    this.currentGames = games;
    const list = document.querySelector('#games-list');
    if (!games.length) {
      this.setGamesMessage('Nenhum jogo público foi encontrado no GitHub.');
      return;
    }
    this.setGamesMessage('');
    if (!window.GameLibraryView) {
      setTimeout(() => this.renderGames(games), 50);
      return;
    }
    if (!this.gameLibrary && this.createGameCardFn) {
      this.gameLibrary = new GameLibraryView(list, {
        mode: preferences.view,
        createItem: this.createGameCardFn,
        onModeChange: mode => {
          preferences.view = mode;
          this.onModeChange?.(mode);
        }
      });
    }
    this.gameLibrary?.setGames(games);
  }

  setGamesMessage(message, error = false) {
    const area = document.querySelector('#games-message');
    if (area) {
      area.textContent = message;
      area.hidden = !message;
      area.classList.toggle('is-error', error);
    }
  }

  showLoadFailure(hasCache, rateLimited = false) {
    if (hasCache) {
      this.setGamesMessage(rateLimited
        ? 'Exibindo informações salvas. O limite de consultas do GitHub foi atingido.'
        : 'Exibindo informações salvas. Não foi possível verificar atualizações agora.', true);
    } else {
      this.setGamesMessage('Não foi possível carregar os jogos agora.', true);
      const retry = document.createElement('button');
      retry.className = 'button button--small button--ghost';
      retry.type = 'button';
      retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', () => this.refreshGames(true));
      const msgArea = document.querySelector('#games-message');
      if (msgArea) { msgArea.append(' ', retry); }
    }
  }

  renderSiteUpdate(repositories) {
    const site = Array.isArray(repositories) ? repositories.find(repo => String(repo?.name).toLowerCase() === 'site') : null;
    const area = document.querySelector('[data-update-project="site"]');
    if (!site || !area) return;
    const dateEl = area.querySelector('[data-update-date]');
    const relEl = area.querySelector('[data-update-relative]');
    const statusEl = area.querySelector('[data-update-status]');
    if (dateEl) dateEl.textContent = formatDate(site.updated_at);
    if (relEl) { relEl.textContent = formatRelativeTime(site.updated_at); relEl.dataset.updatedAt = site.updated_at; }
    if (statusEl) statusEl.textContent = 'Atualizado';
  }

  getGamesContext() {
    return this.currentGames.slice(0, 12).map(game => ({
      name: String(game.name || '').slice(0, 100),
      description: String(game.description || '').slice(0, 240),
      github: isSafeHttpsUrl(game.repositoryUrl, 'github.com') ? game.repositoryUrl : '',
      playUrl: getGamePlayUrl(game)
    }));
  }
}

export { isSafeHttpsUrl, formatRepositoryName, getGameDisplayName, formatDate, formatRelativeTime, normalizeRepository, repositoriesToGames, normalizeCommunityGame, getGamePlayUrl, buildPlayPageUrl };
export { loadGamesCache, saveGamesCache, fetchRepositories };