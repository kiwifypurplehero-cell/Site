/**
 * UI module
 * Handles panels, modals, accordions, and general UI interactions
 */

let lastFocus = null;
const pageScrollLocks = new Set();
let savedPageScrollState = null;

function lockPageScroll(reason) {
  if (!reason || pageScrollLocks.has(reason)) return;
  if (!pageScrollLocks.size) {
    savedPageScrollState = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow
    };
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  pageScrollLocks.add(reason);
}

function unlockPageScroll(reason) {
  pageScrollLocks.delete(reason);
  if (pageScrollLocks.size || !savedPageScrollState) return;
  document.body.style.overflow = savedPageScrollState.bodyOverflow;
  document.documentElement.style.overflow = savedPageScrollState.htmlOverflow;
  savedPageScrollState = null;
}

function closeTransientUiForNavigation() {
  closePanel({ restoreFocus: false });
  document.querySelector('#site-modal')?.setAttribute('hidden', '');
  document.querySelector('#community-dialog')?.setAttribute('hidden', '');
  document.body.classList.remove('modal-open', 'panel-open');
  pageScrollLocks.clear();
  document.body.style.overflow = savedPageScrollState?.bodyOverflow || '';
  document.documentElement.style.overflow = savedPageScrollState?.htmlOverflow || '';
  savedPageScrollState = null;
}

document.addEventListener('plumpgames:before-view-change', closeTransientUiForNavigation);

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let panelCloseTimer = 0;

function openPanel() {
  const panel = $('#gx-side-panel');
  clearTimeout(panelCloseTimer);
  lastFocus = document.activeElement;
  panel.hidden = false;
  panel.inert = false;
  $('#gx-panel-backdrop').hidden = false;
  requestAnimationFrame(() => panel.classList.add('is-open'));
  $('#gx-menu-button').setAttribute('aria-expanded', 'true');
  document.body.classList.add('panel-open');
  $('#gx-panel-close').focus();
}

function closePanel({ restoreFocus = true } = {}) {
  const panel = $('#gx-side-panel');
  if (panel.hidden && !document.body.classList.contains('panel-open')) return;
  panel.classList.remove('is-open');
  panel.inert = true;
  $('#gx-panel-backdrop').hidden = true;
  $('#gx-menu-button').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('panel-open');
  clearTimeout(panelCloseTimer);
  panelCloseTimer = setTimeout(() => { panel.hidden = true; }, 220);
  if (restoreFocus) $('#gx-menu-button').focus();
}

function togglePanel() {
  $('#gx-side-panel').hidden ? openPanel() : closePanel();
}

function setupPanel() {
  $('#gx-menu-button')?.addEventListener('click', togglePanel);
  $('#gx-panel-close')?.addEventListener('click', closePanel);
  $('#gx-panel-backdrop')?.addEventListener('click', () => closePanel());
  $('#gx-side-panel')?.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) closePanel({ restoreFocus: false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#gx-side-panel').hidden) closePanel();
  });
  $$('.gx-accordion__button').forEach(button =>
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      document.getElementById(button.getAttribute('aria-controls')).hidden = open;
    })
  );
}

function showModal(title, html, actions = '') {
  $('#modal-title').textContent = title;
  $('#modal-content').innerHTML = html;
  $('#modal-actions').innerHTML = actions;
  $('#site-modal').hidden = false;
  document.body.classList.add('modal-open');
  lockPageScroll('modal');
}

function closeModal() {
  $('#site-modal').hidden = true;
  document.body.classList.remove('modal-open');
  unlockPageScroll('modal');
  lastFocus?.focus();
}

function setupModals() {
  $$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
  $('[data-open-credits]')?.addEventListener('click', () =>
    showModal('Créditos', '<p>PlumpGames é criado por Matheus (Plump), com ajuda do Codex.</p>')
  );
  $('[data-open-privacy]')?.addEventListener('click', () =>
    showModal('Política de Privacidade', '<p>O perfil de jogo usa um UUID aleatório e cookie first-party. Salvamos somente jogos, sessões e tempo ativo; não usamos e-mail, senha, IP como identidade, localização ou fingerprint. Sem autenticação, não existe sincronização confiável entre dispositivos. Você pode exportar ou apagar o histórico em Perfil.</p>')
  );
  $('[data-open-terms]')?.addEventListener('click', () =>
    showModal('Termos de Uso', '<p>Os projetos são oferecidos como estão. Consulte o repositório de cada jogo para detalhes.</p>')
  );
}

function setupScrollEffects() {
  window.addEventListener('scroll', () =>
    $('.site-header')?.classList.toggle('scrolled', scrollY > 20),
    { passive: true }
  );
}

function setupRevealAnimations() {
  const revealObserver = new IntersectionObserver(entries =>
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .08 });
  $$('.reveal').forEach(item => revealObserver.observe(item));
}

function setupSidebar() {
  const sidebarPreference = 'plumpgames-sidebar-collapsed';
  const applySidebarPreference = collapsed => {
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    $('#sidebar-toggle')?.setAttribute('aria-label', collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral');
  };
  applySidebarPreference(localStorage.getItem(sidebarPreference) === 'true');
  $('#sidebar-toggle')?.addEventListener('click', () => {
    const collapsed = !document.documentElement.classList.contains('sidebar-collapsed');
    applySidebarPreference(collapsed);
    localStorage.setItem(sidebarPreference, String(collapsed));
  });
  $('[data-sidebar-logout]')?.addEventListener('click', () => window.PlumpAuth?.logout());
}

function setupSimpleAccent() {
  const storedAccent = '#8b5cf6';
  const applySimpleAccent = color => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    document.documentElement.style.setProperty('--color-accent', color);
  };
  document.querySelectorAll('[data-simple-accent]').forEach(button =>
    button.addEventListener('click', () => applySimpleAccent(button.dataset.simpleAccent))
  );
  document.querySelector('#simple-accent')?.addEventListener('input', event => applySimpleAccent(event.target.value));
  if (document.querySelector('#simple-accent')) document.querySelector('#simple-accent').value = storedAccent;
}

function setupSimpleAccount() {
  const account = document.querySelector('#simple-account');
  if (!account) return;
  if (window.plumpUser && !window.plumpUser.isGuest) {
    const name = document.createElement('p');
    name.textContent = window.plumpUser.displayName || window.plumpUser.username;
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.textContent = 'Sair';
    logout.onclick = () => window.PlumpAuth?.logout();
    account.append(name, logout);
  } else {
    const label = document.createElement('p');
    label.textContent = 'Modo visitante';
    const login = document.createElement('a');
    login.href = '/';
    login.textContent = 'Entrar';
    const register = document.createElement('a');
    register.href = '/?register=1';
    register.textContent = 'Criar conta';
    account.append(label, login, document.createTextNode(' · '), register);
  }
}

function setupFutureCards() {
  const future = ['Favoritos', 'Biblioteca', 'Conquistas', 'Comentários', 'Mais wallpapers'];
  const container = document.querySelector('#future-content');
  if (container) {
    container.innerHTML = future.map(item =>
      `<div class="future-card"><strong>${item}</strong><span>Em desenvolvimento</span></div>`
    ).join('');
  }
}

function setupOfficialUrlNotice() {
  const OFFICIAL_URL = 'https://site.kiwifypurplehero.workers.dev/';
  if (!location.href.startsWith(OFFICIAL_URL) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.info(`Site oficial: ${OFFICIAL_URL}`);
  }
}

function setupUpdateRelativeTimes() {
  function updateRelativeTimes() {
    $$('.relative-update[data-updated-at]').forEach(node =>
      node.textContent = formatRelativeTime(node.dataset.updatedAt)
    );
  }
  document.querySelector('#refresh-games')?.addEventListener('click', () => window.gamesManager?.refreshGames(true));
  setInterval(updateRelativeTimes, 60 * 1000);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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

function openGamePage(game) {
  const playPageUrl = buildPlayPageUrl(game, location.href);
  if (!playPageUrl) return;
  const tab = window.open(playPageUrl, '_blank', 'noopener');
  if (!tab) window.location.href = playPageUrl;
}

function appendModalRow(list, label, value) {
  const row = element('div', 'game-modal__row');
  row.append(element('dt', '', label), element('dd', '', String(value)));
  list.append(row);
}

function createGameCover(game) {
  const cover = element('div', 'game-card__image game-cover');
  cover.setAttribute('role', 'img');
  cover.setAttribute('aria-label', `Capa automática de ${game.name}`);
  const initials = game.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toLocaleUpperCase('pt-BR') || 'PG';
  if (game.community && isSafeHttpsUrl(game.coverUrl)) {
    const image = element('img', 'game-cover__image');
    image.src = game.coverUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    cover.append(image);
  }
  const declaredPlatforms = Array.isArray(game.compatibility) ? game.compatibility.map(value => String(value).toLowerCase()) : [];
  const platforms = element('div', 'game-cover__platforms');
  platforms.setAttribute('aria-label', declaredPlatforms.length ? 'Compatibilidade de plataforma' : 'Compatibilidade de plataforma ainda não informada');
  [['desktop', '▣', 'PC'], ['mobile', '▯', 'Celular']].forEach(([id, icon, label]) => {
    const supported = declaredPlatforms.includes(id);
    const indicator = element('span', 'platform-indicator', `${icon} ${label}`);
    indicator.dataset.platform = id;
    indicator.dataset.supported = declaredPlatforms.length ? String(supported) : 'unknown';
    platforms.append(indicator);
  });
  cover.append(platforms, element('b', 'game-monogram', initials), element('small', '', game.name));
  return cover;
}

function detailItem(label, value, relative = false) {
  const wrapper = element('div');
  wrapper.append(element('dt', '', label));
  const definition = element('dd', '', value);
  if (relative) { definition.classList.add('relative-update'); definition.dataset.updatedAt = relative; }
  wrapper.append(definition);
  return wrapper;
}

function safeLink(label, url, primary = false) {
  if (!isSafeHttpsUrl(url, 'github.com')) return null;
  const link = element('a', `button button--small ${primary ? 'button--primary' : 'button--ghost'}`, label);
  link.href = url;
  return link;
}

function isSafeHttpsUrl(value, allowedHost) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!allowedHost || url.hostname === allowedHost);
  } catch { return false; }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date).replace(',', ' às');
}

function createGameCard(game) {
  const card = element('article', `game-card game-card--featured${game.community ? ' game-card--community' : ''}`);
  card.dataset.catalog = game.community ? 'community' : 'official';
  card.dataset.repositoryId = game.id;
  card.dataset.gameId = `git:web:${String(game.rawName || game.id).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '')}`;
  const body = element('div', 'game-card__body');
  body.append(element('p', 'card-kicker', `${game.community ? 'COMUNIDADE' : 'OFICIAL'} • ${game.language} • ${game.status}`), element('h3', '', game.name));
  if (game.community) body.append(element('p', 'community-creator', `Por: ${game.creator}`));
  body.append(element('p', '', game.description));
  const details = element('dl', 'game-details');
  if (game.community) details.append(detailItem('Plataforma', game.platform), detailItem('Última atualização', formatDate(game.updatedAt)), ...(game.license ? [detailItem('Licença', game.license)] : []));
  else details.append(detailItem('Versão', game.version || 'Não informado'), detailItem('Lançamento', game.createdAt ? formatDate(game.createdAt) : 'Não informado'), detailItem('Última atualização', formatDate(game.updatedAt)));
  body.append(details);
  const compactMeta = element('p', 'compact-meta');
  const compactRelative = element('span', '', `Atualizado em: ${formatDate(game.updatedAt)}`);
  compactMeta.append(element('span', '', `Lançamento: ${game.createdAt ? formatDate(game.createdAt) : 'Não informado'}`), compactRelative, element('span', '', `Versão: ${game.version || 'Não informado'}`));
  body.append(compactMeta);
  const actions = element('div', 'card-actions');
  const playUrl = getGamePlayUrl(game);
  if (playUrl) {
    const play = element('button', 'button button--small button--play', '▶ Jogar agora');
    play.type = 'button';
    play.addEventListener('click', () => openGamePage(game));
    actions.append(play);
  }
  const download = safeLink('↓ Baixar', game.downloadUrl, true);
  const github = safeLink('GitHub', game.repositoryUrl);
  if (download) actions.append(download);
  if (github) actions.append(github);
  const detailsButton = element('button', 'button button--small button--ghost', 'Mais detalhes');
  detailsButton.type = 'button';
  detailsButton.addEventListener('click', () => openGameDetails(game));
  actions.append(detailsButton);
  body.append(actions);
  card.append(createGameCover(game), body);
  card.addEventListener('pointermove', event => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = card.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5).toFixed(3);
    const y = ((event.clientY - bounds.top) / bounds.height - .5).toFixed(3);
    card.style.setProperty('--star-x', x);
    card.style.setProperty('--star-y', y);
  }, { passive: true });
  const resetStars = () => { card.style.setProperty('--star-x', 0); card.style.setProperty('--star-y', 0); };
  card.addEventListener('pointerleave', resetStars, { passive: true });
  card.addEventListener('pointercancel', resetStars, { passive: true });
  card.addEventListener('pointerup', resetStars, { passive: true });
  return card;
}

function setGamesMessage(message, error = false) {
  const area = document.querySelector('#games-message');
  if (area) {
    area.textContent = message;
    area.hidden = !message;
    area.classList.toggle('is-error', error);
  }
}

function openGameDetails(game) {
  lastFocus = document.activeElement;
  document.querySelector('#modal-title').textContent = game.name;
  const content = document.querySelector('#modal-content');
  const actions = document.querySelector('#modal-actions');
  if (!content || !actions) return;
  content.replaceChildren();
  actions.replaceChildren();
  content.append(element('p', '', game.description));
  const list = element('dl', 'game-modal__details');
  appendModalRow(list, 'URL do repositório', game.repositoryUrl || 'Indisponível');
  appendModalRow(list, 'Linguagem', game.language);
  if (game.community) {
    appendModalRow(list, 'Criador', game.creator);
    appendModalRow(list, 'Plataforma', game.platform);
    appendModalRow(list, 'Licença', game.license || 'Não informada');
  } else {
    appendModalRow(list, 'Branch padrão', game.branch);
  }
  appendModalRow(list, 'Criação', formatDate(game.createdAt));
  appendModalRow(list, 'Última atualização', formatDate(game.updatedAt));
  appendModalRow(list, 'Estrelas', game.stars);
  appendModalRow(list, 'Forks', game.forks);
  appendModalRow(list, 'Tamanho aproximado', `${game.size.toLocaleString('pt-BR')} KB`);
  content.append(list);
  const playUrl = getGamePlayUrl(game);
  if (playUrl) {
    const play = element('button', 'button button--small button--play', '▶ Jogar agora');
    play.type = 'button';
    play.addEventListener('click', () => openGamePage(game));
    actions.append(play);
  }
  const download = safeLink('↓ Baixar', game.downloadUrl, true);
  const github = safeLink('GitHub', game.repositoryUrl);
  if (download) actions.append(download);
  if (github) actions.append(github);
  document.querySelector('#site-modal').hidden = false;
  document.body.classList.add('modal-open');
  lockPageScroll('modal');
  document.querySelector('#site-modal .modal__close')?.focus();
}

function getGamePlayUrl(game) {
  // This will be overridden by the imported version
  return '';
}

function buildPlayPageUrl(game, baseUrl) {
  // This will be overridden by the imported version
  return '';
}

export function setupUI() {
  setupPanel();
  setupModals();
  setupScrollEffects();
  setupRevealAnimations();
  setupSidebar();
  setupSimpleAccent();
  setupSimpleAccount();
  setupFutureCards();
  setupOfficialUrlNotice();
  setupUpdateRelativeTimes();
}

export { showModal, closeModal, openPanel, closePanel, togglePanel, lockPageScroll, unlockPageScroll, createGameCard, setGamesMessage, openGameDetails, openGamePage, element, formatDate, formatRelativeTime, isSafeHttpsUrl, safeLink, appendModalRow, createGameCover, detailItem, lastFocus, pageScrollLocks, savedPageScrollState };
export { getGamePlayUrl, buildPlayPageUrl };