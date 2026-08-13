'use strict';

const STORAGE_KEY = 'plumpgames-preferences-v3';
const { getGamePlayUrl, buildPlayPageUrl } = PlumpPlay;
const OFFICIAL_URL = 'https://site.kiwifypurplehero.workers.dev/';
const DEFAULT_COLORS = { primary: '#7c3aed', secondary: '#06b6d4', accent: '#f0abfc', glow: '#a855f7', menu: '#0b0c19', button: '#7c3aed' };
const themes = {
  original: DEFAULT_COLORS,
  blue: { primary:'#22d3ee', secondary:'#0ea5e9', accent:'#bae6fd', glow:'#67e8f9', menu:'#07131e', button:'#0284c7' },
  purple: { primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#100b20', button:'#7c3aed' },
  red: { primary:'#ef4444', secondary:'#be123c', accent:'#fecdd3', glow:'#fb7185', menu:'#1b080d', button:'#e11d48' },
  green: { primary:'#22c55e', secondary:'#059669', accent:'#bbf7d0', glow:'#4ade80', menu:'#06170e', button:'#16a34a' },
  light: { primary:'#4f46e5', secondary:'#0284c7', accent:'#312e81', glow:'#818cf8', menu:'#e8eaf5', button:'#4f46e5' },
  dark: { primary:'#94a3b8', secondary:'#64748b', accent:'#f8fafc', glow:'#cbd5e1', menu:'#050611', button:'#475569' }
};
const wallpapers = [
  { id:'lantern', name:'Lantern Moths', performance:'Leve', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Lantern-Moths.mp4', colors:{ primary:'#f59e0b', secondary:'#f97316', accent:'#fde68a', glow:'#fbbf24', menu:'#160d04', button:'#f59e0b' } },
  { id:'cafe', name:'Cafe by the Beach', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Cafe-by-the-Beach.mp4', colors:{ primary:'#22d3ee', secondary:'#0ea5e9', accent:'#fef3c7', glow:'#67e8f9', menu:'#06151b', button:'#0891b2' } },
  { id:'miyabi', name:'Hoshimi Miyabi ZZZ', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Hoshimi-Miyabi-ZZZ-1.mp4', colors:{ primary:'#38bdf8', secondary:'#6366f1', accent:'#e0f2fe', glow:'#60a5fa', menu:'#080d20', button:'#4f46e5' } },
  { id:'minecraft', name:'Minecraft Mountain Cabin', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Minecraft-Mountain-Cabin.mp4', colors:{ primary:'#22c55e', secondary:'#65a30d', accent:'#d9f99d', glow:'#4ade80', menu:'#07160b', button:'#16a34a' } },
  { id:'sung', name:'Sung Jin Woo and Beru', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Anime/PREVIEW-Sung-Jin-Woo-and-Beru.mp4', colors:{ primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#0e0920', button:'#7c3aed' } },
  { id:'none', name:'Sem animação', performance:'Muito leve', url:null, colors:DEFAULT_COLORS }
];
const defaults = { wallpaper:'none', wallpaperColors:true, theme:'original', custom:DEFAULT_COLORS, menuOpacity:.88, view:'detailed', reduceMotion:false, economy:false, highContrast:false, glow:1, opacity:.86, animation:1 };
let storedPreferences = {};
try { storedPreferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { localStorage.removeItem(STORAGE_KEY); }
let preferences = { ...defaults, ...storedPreferences, custom: { ...DEFAULT_COLORS, ...(storedPreferences.custom || {}) } };
let lastFocus = null;
const pageScrollLocks = new Set();
let savedPageScrollState = null;

function lockPageScroll(reason) {
  if (!reason || pageScrollLocks.has(reason)) return;
  if (!pageScrollLocks.size) {
    savedPageScrollState = { bodyOverflow:document.body.style.overflow, htmlOverflow:document.documentElement.style.overflow };
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
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
const currentWallpaper = () => wallpapers.find(item => item.id === preferences.wallpaper) || wallpapers.at(-1);

function applyColors(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key,value]) => root.style.setProperty(`--color-${key}`, value));
  root.style.setProperty('--menu-border', `${colors.primary}88`);
  root.style.setProperty('--menu-hover', `${colors.primary}26`);
  root.style.setProperty('--menu-opacity', preferences.menuOpacity);
}
function activeColors() {
  if (preferences.wallpaperColors) return currentWallpaper().colors;
  return preferences.theme === 'custom' ? preferences.custom : (themes[preferences.theme] || DEFAULT_COLORS);
}
function syncControls() {
  $('#theme-select').value = preferences.theme;
  $('#wallpaper-colors').checked = preferences.wallpaperColors;
  $('#menu-opacity').value = preferences.menuOpacity;
  $('#economy-mode').checked = preferences.economy;
  $('#glow-strength').value = preferences.glow;
  $('#card-opacity').value = preferences.opacity;
  $('#animation-strength').value = preferences.animation;
  const colors = preferences.custom;
  ['primary','secondary','accent','menu','button','glow'].forEach(key => $(`#color-${key}`).value = colors[key]);
  $$('[data-view-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewMode === preferences.view)));
  $('#games-list').dataset.view = preferences.view;
  document.body.classList.toggle('reduce-animations', preferences.reduceMotion);
  document.body.classList.toggle('high-contrast', preferences.highContrast);
  document.documentElement.classList.toggle('performance-mode',preferences.economy);
  document.documentElement.style.setProperty('--glow-strength', preferences.glow);
  document.documentElement.style.setProperty('--card-opacity', preferences.opacity);
  document.documentElement.style.setProperty('--animation-strength', preferences.animation);
  applyColors(activeColors());
}

function setStatus(message, error = false) {
  const status = $('#wallpaper-status');
  status.textContent = message;
  status.classList.toggle('is-error', error);
  $('#wallpaper-retry').hidden = !error;
}

const wallpaperManager = {
  active:null, pending:null, request:0, manuallyPaused:false, resumeAfterHidden:false,
  reduced(){ return preferences.reduceMotion || preferences.economy || matchMedia('(prefers-reduced-motion: reduce)').matches; }
};

function createWallpaperVideo(item) {
  const video=document.createElement('video');
  video.className='live-wallpaper-video'; video.autoplay=true; video.muted=true; video.loop=true; video.playsInline=true; video.preload='metadata';
  video.setAttribute('aria-hidden','true'); video.src=item.url;
  return video;
}

function loadWallpaper(item) {
  const video=createWallpaperVideo(item);
  return new Promise((resolve,reject)=>{
    const done=()=>{cleanup();resolve(video);}, fail=()=>{cleanup();reject(new Error('wallpaper-load'));};
    const cleanup=()=>{video.removeEventListener('loadeddata',done);video.removeEventListener('canplay',done);video.removeEventListener('error',fail);};
    video.addEventListener('loadeddata',done,{once:true}); video.addEventListener('canplay',done,{once:true}); video.addEventListener('error',fail,{once:true});
    video.load();
  });
}

function destroyVideo(video) {
  if(!video)return; video.pause(); video.removeAttribute('src'); video.load(); video.remove();
}
function destroyWallpaper(){ destroyVideo(wallpaperManager.pending); destroyVideo(wallpaperManager.active); wallpaperManager.pending=null; wallpaperManager.active=null; }
function pauseWallpaper(manual=true){ if(manual)wallpaperManager.manuallyPaused=true; wallpaperManager.active?.pause(); wallpaperManager.pending?.pause(); }
function resumeWallpaper(){
  wallpaperManager.manuallyPaused=false;
  if(!document.hidden&&!wallpaperManager.reduced()) wallpaperManager.active?.play().catch(()=>setStatus('O navegador bloqueou a reprodução.',true));
}
async function transitionWallpaper(next, old, token) {
  if(token!==wallpaperManager.request){destroyVideo(next);return false;}
  next.style.willChange='opacity'; if(old)old.style.willChange='opacity'; next.classList.add('is-visible'); old?.classList.remove('is-visible');
  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420));
  if(token!==wallpaperManager.request){destroyVideo(next);old?.classList.add('is-visible');if(old)old.style.willChange='';return false;}
  destroyVideo(old); next.style.willChange=''; wallpaperManager.active=next; wallpaperManager.pending=null; return true;
}
async function applyWallpaper(item, restoring=false) {
  const token=++wallpaperManager.request;
  destroyVideo(wallpaperManager.pending); wallpaperManager.pending=null;
  if(!item.url||wallpaperManager.reduced()) {
    destroyWallpaper(); preferences.wallpaper=item.id; save(); applyColors(activeColors()); renderWallpapers();
    setStatus(item.url?'Movimento reduzido ou modo desempenho ativo: usando fundo estático.':'Wallpaper sem animação ativo.'); return;
  }
  setStatus('Carregando wallpaper…');
  try {
    const next=await loadWallpaper(item); if(token!==wallpaperManager.request){destroyVideo(next);return;}
    wallpaperManager.pending=next; $('#wallpaper-stage').append(next); await next.play();
    const applied=await transitionWallpaper(next,wallpaperManager.active,token); if(!applied)return;
    preferences.wallpaper=item.id; save(); applyColors(activeColors()); renderWallpapers(); setStatus(`${item.name} ativo.`);
  } catch {
    destroyVideo(wallpaperManager.pending); wallpaperManager.pending=null;
    setStatus('Não foi possível carregar o wallpaper. O anterior foi mantido.',true);
    if(!restoring&&!wallpaperManager.manuallyPaused) wallpaperManager.active?.play().catch(()=>{});
  }
}
function selectWallpaper(id, restoring=false) { const item=wallpapers.find(entry=>entry.id===id); return item?applyWallpaper(item,restoring):Promise.resolve(); }

function renderWallpapers() {
  $('#wallpaper-selector').innerHTML = wallpapers.map(item => `<article class="wallpaper-card${item.id === preferences.wallpaper ? ' is-selected' : ''}"><div class="wallpaper-thumb wallpaper-thumb--${item.id}" aria-hidden="true"></div><div><strong>${item.name}</strong><small>${item.performance}</small></div><button class="button button--small" type="button" data-wallpaper="${item.id}" ${item.id === preferences.wallpaper ? 'aria-pressed="true"' : ''}>${item.id === preferences.wallpaper ? 'Selecionado' : 'Selecionar'}</button></article>`).join('');
  $$('[data-wallpaper]').forEach(button => button.addEventListener('click', () => selectWallpaper(button.dataset.wallpaper)));
}

let panelCloseTimer = 0;
function openPanel() {
  const panel=$('#gx-side-panel'); clearTimeout(panelCloseTimer); lastFocus=document.activeElement;
  panel.hidden=false; $('#gx-panel-backdrop').hidden=false; lockPageScroll('menu');
  requestAnimationFrame(()=>panel.classList.add('is-open'));
  $('#gx-menu-button').setAttribute('aria-expanded','true'); document.body.classList.add('panel-open'); $('#gx-panel-close').focus();
}
function closePanel({restoreFocus=true}={}) {
  const panel=$('#gx-side-panel');
  if (panel.hidden && !document.body.classList.contains('panel-open')) { unlockPageScroll('menu'); return; }
  panel.classList.remove('is-open'); $('#gx-menu-button').setAttribute('aria-expanded','false'); document.body.classList.remove('panel-open'); unlockPageScroll('menu');
  clearTimeout(panelCloseTimer); panelCloseTimer=setTimeout(()=>{ panel.hidden=true; $('#gx-panel-backdrop').hidden=true; },220);
  if (restoreFocus) $('#gx-menu-button').focus();
}
function togglePanel() { $('#gx-side-panel').hidden ? openPanel() : closePanel(); }
$('#gx-menu-button').addEventListener('click', togglePanel); $('#gx-panel-close').addEventListener('click', closePanel); $('#gx-panel-backdrop').addEventListener('click',()=>closePanel());
$('#gx-side-panel').addEventListener('click',event=>{ const link=event.target.closest('a[href^="#"]'); if(link) closePanel({restoreFocus:false}); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#gx-side-panel').hidden) closePanel(); });
$$('.gx-accordion__button').forEach(button => button.addEventListener('click', () => { const open=button.getAttribute('aria-expanded')==='true'; button.setAttribute('aria-expanded', String(!open)); document.getElementById(button.getAttribute('aria-controls')).hidden=open; }));

$('#theme-select').addEventListener('change', event => { preferences.theme=event.target.value; if (event.target.value!=='custom') preferences.custom={...(themes[event.target.value]||DEFAULT_COLORS)}; preferences.wallpaperColors=false; save(); syncControls(); });
$('#apply-theme').addEventListener('click', () => { preferences.custom=Object.fromEntries(['primary','secondary','accent','menu','button','glow'].map(key=>[key,$(`#color-${key}`).value])); preferences.theme='custom'; preferences.wallpaperColors=false; save(); syncControls(); });
$('#reset-theme').addEventListener('click', () => { preferences={...defaults, custom:{...DEFAULT_COLORS}}; save(); syncControls(); selectWallpaper('none'); });
$('#wallpaper-colors').addEventListener('change', event => { preferences.wallpaperColors=event.target.checked; save(); syncControls(); });
$('#menu-opacity').addEventListener('input', event => { preferences.menuOpacity=Number(event.target.value); save(); syncControls(); });
$$('[data-view-mode]').forEach(button => button.addEventListener('click', () => { preferences.view=button.dataset.viewMode; save(); syncControls(); }));
[['economy-mode','economy']].forEach(([id,key]) => $(`#${id}`).addEventListener('change', event => { preferences[key]=event.target.checked; save(); syncControls(); if(key==='reduceMotion'||key==='economy') selectWallpaper(preferences.wallpaper); }));
[['glow-strength','glow'],['card-opacity','opacity'],['animation-strength','animation']].forEach(([id,key]) => $(`#${id}`).addEventListener('input', event => { preferences[key]=Number(event.target.value); save(); syncControls(); }));
$('#wallpaper-pause').addEventListener('click',()=>{pauseWallpaper(true);setStatus('Wallpaper pausado.');});
$('#wallpaper-resume').addEventListener('click',resumeWallpaper);
$('#wallpaper-retry').addEventListener('click',()=>selectWallpaper(preferences.wallpaper));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){wallpaperManager.resumeAfterHidden=Boolean(wallpaperManager.active&&!wallpaperManager.active.paused&&!wallpaperManager.manuallyPaused);pauseWallpaper(false);}else if(wallpaperManager.resumeAfterHidden&&!wallpaperManager.manuallyPaused){wallpaperManager.resumeAfterHidden=false;resumeWallpaper();}});
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)'); motionPreference.addEventListener?.('change',()=>selectWallpaper(preferences.wallpaper,true));
const weakDevice=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4); $('#performance-suggestion').hidden=!weakDevice||preferences.economy;

const future = ['Favoritos','Biblioteca','Conquistas','Comentários','Mais wallpapers'];
$('#future-content').innerHTML = future.map(item => `<div class="future-card"><strong>${item}</strong><span>Em desenvolvimento</span></div>`).join('');

function showModal(title, html, actions='') {
  $('#modal-title').textContent=title;
  $('#modal-content').innerHTML=html;
  $('#modal-actions').innerHTML=actions;
  $('#site-modal').hidden=false; document.body.classList.add('modal-open'); lockPageScroll('modal');
}
function closeModal() { $('#site-modal').hidden=true; document.body.classList.remove('modal-open'); unlockPageScroll('modal'); lastFocus?.focus(); }
$$('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModal));
$('[data-open-credits]').addEventListener('click',()=>showModal('Créditos','<p>PlumpGames é criado por Matheus (Plump), com ajuda do Codex.</p>'));
$('[data-open-privacy]').addEventListener('click',()=>showModal('Política de Privacidade','<p>Preferências e cache ficam no navegador. O site não possui contas. Dados informados voluntariamente no formulário de jogos da comunidade são publicados no catálogo compartilhado.</p>'));
$('[data-open-terms]').addEventListener('click',()=>showModal('Termos de Uso','<p>Os projetos são oferecidos como estão. Consulte o repositório de cada jogo para detalhes.</p>'));

if (!location.href.startsWith(OFFICIAL_URL) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') console.info(`Site oficial: ${OFFICIAL_URL}`);
renderWallpapers(); syncControls(); selectWallpaper(preferences.wallpaper, true);

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), {threshold:.08});
$$('.reveal').forEach(item => revealObserver.observe(item));
window.addEventListener('scroll', () => $('.site-header').classList.toggle('scrolled', scrollY > 20), {passive:true});

const GITHUB_REPOSITORIES_URL = 'https://api.github.com/users/kiwifypurplehero-cell/repos?per_page=100&sort=updated';
const GAMES_CACHE_KEY = 'plumpgamesGithubReposCache';
const GAMES_CACHE_TTL = 5 * 60 * 1000;
const IGNORED_REPOSITORIES = [
  'site'
];
const GAME_NAME_OVERRIDES = Object.freeze({
  'cs1-6html': 'CS 1.6 PLH'
});
const PLAYABLE_REPOSITORIES = {
  'fnf': {
    name: 'FNF',
    playUrl: 'https://kiwifypurplehero-cell.github.io/FNF/'
  },
  'cs1-6html': {
    name: 'CS 1.6 PLH',
    playUrl: 'https://kiwifypurplehero-cell.github.io/CS1-6HTML/'
  }
};
let currentGames = [];
let officialGames = [];
let communityGames = [];
let refreshInProgress = false;
function isSafeHttpsUrl(value, allowedHost) {
  try { const url=new URL(value); return url.protocol==='https:'&&(!allowedHost||url.hostname===allowedHost); } catch{return false;}
}

function formatRepositoryName(name) {
  const acronyms = new Set(['html','css','js','api','vr','plh']);
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
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(date).replace(',', ' às');
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
  return !name || repo.fork === true || repo.archived === true || repo.private === true || IGNORED_REPOSITORIES.some(ignored => ignored.toLowerCase() === name);
}

function filterRepositories(repositories) {
  if (!Array.isArray(repositories)) return [];
  return repositories.filter(repo => repo && typeof repo === 'object' && !shouldIgnoreRepository(repo));
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
    id: String(repo.id ?? fullName), name: getGameDisplayName({ ...repo, gameMetadata:playableConfig }), rawName,
    description: typeof repo.description === 'string' && repo.description.trim() ? repo.description.trim() : 'Projeto disponível na PlumpGames.',
    language: typeof repo.language === 'string' && repo.language.trim() ? repo.language : 'Não informada',
    updatedAt: repo.updated_at, createdAt: repo.created_at, branch: branch || 'Não informada', status:'Disponível',
    repositoryUrl, downloadUrl, playUrl:playableConfig?.playUrl || getGitHubPagesUrl({rawName}), stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
    forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0, size: Number.isFinite(repo.size) ? repo.size : 0
  };
}

function getGitHubPagesUrl(repo) {
  const name = String(repo?.rawName || repo?.name || '').trim();
  return name ? `https://kiwifypurplehero-cell.github.io/${encodeURIComponent(name)}/` : '';
}

function openGamePage(game) {
  const playPageUrl = buildPlayPageUrl(game, location.href);
  if (!playPageUrl) return;
  window.open(playPageUrl, '_blank', 'noopener,noreferrer');
}

function loadGamesCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(GAMES_CACHE_KEY) || 'null');
    if (!cache || !Array.isArray(cache.repositories) || !Number.isFinite(cache.savedAt)) return null;
    return { ...cache, valid: Date.now() - cache.savedAt < GAMES_CACHE_TTL };
  } catch { return null; }
}

function saveGamesCache(repositories) {
  try { localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify({ savedAt:Date.now(), repositories })); }
  catch (error) { console.warn('Não foi possível salvar o cache de jogos.', error); }
}

async function fetchRepositories() {
  const response = await fetch(GITHUB_REPOSITORIES_URL, { headers:{ Accept:'application/vnd.github+json' } });
  if (!response.ok) {
    const error = new Error(response.status === 403 ? 'Limite de consultas do GitHub atingido.' : 'Falha ao consultar o GitHub.');
    error.status = response.status;
    throw error;
  }
  const repositories = await response.json();
  if (!Array.isArray(repositories)) throw new Error('Resposta inesperada do GitHub.');
  return repositories;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createGameCover(game) {
  const cover = element('div', 'game-card__image game-cover');
  cover.setAttribute('role','img');
  cover.setAttribute('aria-label', `Capa automática de ${game.name}`);
  const status = element('span','status',game.community?'COMUNIDADE':'OFICIAL');
  const initials = game.name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('pt-BR') || 'PG';
  if (game.community && isSafeHttpsUrl(game.coverUrl)) { const image=element('img','game-cover__image'); image.src=game.coverUrl; image.alt=''; image.loading='lazy'; image.referrerPolicy='no-referrer'; cover.append(image); }
  cover.append(status, element('span','game-cover__icon','🎮'), element('b','',initials), element('small','',game.name));
  return cover;
}

function detailItem(label, value, relative = false) {
  const wrapper = element('div');
  wrapper.append(element('dt','',label));
  const definition = element('dd','',value);
  if (relative) { definition.classList.add('relative-update'); definition.dataset.updatedAt = relative; }
  wrapper.append(definition);
  return wrapper;
}

function safeLink(label, url, primary = false) {
  if (!isSafeHttpsUrl(url, 'github.com')) return null;
  const link = element('a', `button button--small ${primary ? 'button--primary' : 'button--ghost'}`, label);
  link.href=url; link.target='_blank'; link.rel='noopener noreferrer';
  return link;
}

function createGameCard(game) {
  const card = element('article',`game-card game-card--featured${game.community?' game-card--community':''}`);
  card.dataset.catalog=game.community?'community':'official';
  card.dataset.repositoryId=game.id;
  const body=element('div','game-card__body');
  body.append(element('p','card-kicker',`${game.community?'COMUNIDADE':'OFICIAL'} • ${game.language} • ${game.status}`), element('h3','',game.name));
  if(game.community)body.append(element('p','community-creator',`Por: ${game.creator}`));
  body.append(element('p','',game.description));
  const details=element('dl','game-details');
  if(game.community) details.append(detailItem('Plataforma',game.platform),detailItem('Última atualização',formatDate(game.updatedAt)),...(game.license?[detailItem('Licença',game.license)]:[]));
  else details.append(detailItem('Linguagem',game.language), detailItem('Branch padrão',game.branch), detailItem('Última atualização',formatDate(game.updatedAt)), detailItem('Status',game.status), detailItem('Atualização relativa',formatRelativeTime(game.updatedAt),game.updatedAt));
  body.append(details);
  const compactMeta=element('p','compact-meta');
  const compactRelative=element('span','relative-update',formatRelativeTime(game.updatedAt)); compactRelative.dataset.updatedAt=game.updatedAt;
  compactMeta.append(element('span','',game.language),compactRelative); body.append(compactMeta);
  const actions=element('div','card-actions');
  const playUrl=getGamePlayUrl(game);
  if (playUrl) { const play=element('button','button button--small button--play','▶ Jogar agora'); play.type='button'; play.addEventListener('click',()=>openGamePage(game)); actions.append(play); }
  const download=safeLink('↓ Baixar',game.downloadUrl,true); const github=safeLink('GitHub',game.repositoryUrl);
  if (download) actions.append(download); if (github) actions.append(github);
  const detailsButton=element('button','button button--small button--ghost','Mais detalhes');
  detailsButton.type='button'; detailsButton.addEventListener('click',()=>openGameDetails(game)); actions.append(detailsButton);
  body.append(actions); card.append(createGameCover(game),body); return card;
}

function setGamesMessage(message, error = false) {
  const area=$('#games-message'); area.textContent=message; area.hidden=!message; area.classList.toggle('is-error',error);
}

function renderGames(games) {
  currentGames=games;
  const list=$('#games-list'); list.replaceChildren();
  if (!games.length) { setGamesMessage('Nenhum jogo público foi encontrado no GitHub.'); return; }
  setGamesMessage('');
  const fragment=document.createDocumentFragment(); games.forEach(game=>fragment.append(createGameCard(game))); list.append(fragment);
}

function renderAllGames() { renderGames([...officialGames,...communityGames]); }

function normalizeCommunityGame(game) {
  return { ...game,id:`community-${game.id}`,community:true,status:'COMUNIDADE',rawName:game.githubRepo,repositoryUrl:game.githubUrl,playUrl:game.playUrl||'',coverUrl:game.coverUrl||'',language:game.language||'Não informada',branch:'—',downloadUrl:'',updatedAt:game.updatedAt,createdAt:game.createdAt,stars:Number(game.stars)||0,forks:0,size:0 };
}

async function loadCommunityGames() {
  try { const response=await fetch('/api/community-games',{headers:{Accept:'application/json'}}); if(!response.ok)throw new Error(String(response.status)); const payload=await response.json(); communityGames=Array.isArray(payload.games)?payload.games.map(normalizeCommunityGame):[]; $('#community-message').hidden=true; renderAllGames(); }
  catch(error){console.warn('Community catalog unavailable',error); $('#community-message').textContent='Não foi possível carregar os jogos da comunidade agora.'; $('#community-message').hidden=false;}
}

function repositoriesToGames(repositories) {
  return filterRepositories(repositories).map(normalizeRepository).sort((a,b) => {
    const dateDifference = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return dateDifference || a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'});
  });
}

function renderSiteUpdate(repositories) {
  const site=Array.isArray(repositories) ? repositories.find(repo=>String(repo?.name).toLowerCase()==='site') : null;
  const area=$('[data-update-project="site"]'); if(!site || !area) return;
  area.querySelector('[data-update-date]').textContent=formatDate(site.updated_at);
  area.querySelector('[data-update-relative]').textContent=formatRelativeTime(site.updated_at);
  area.querySelector('[data-update-relative]').dataset.updatedAt=site.updated_at;
  area.querySelector('[data-update-status]').textContent='Atualizado';
}

function showLoadFailure(hasCache, rateLimited = false) {
  if (hasCache) setGamesMessage(rateLimited ? 'Exibindo informações salvas. O limite de consultas do GitHub foi atingido.' : 'Exibindo informações salvas. Não foi possível verificar atualizações agora.',true);
  else {
    setGamesMessage('Não foi possível carregar os jogos agora.',true);
    const retry=element('button','button button--small button--ghost','Tentar novamente'); retry.type='button'; retry.addEventListener('click',()=>refreshGames(true)); $('#games-message').append(' ',retry);
  }
}

async function refreshGames(force = false) {
  if (refreshInProgress) return;
  const cache=loadGamesCache();
  if (!force && cache?.valid) { officialGames=repositoriesToGames(cache.repositories); renderAllGames(); renderSiteUpdate(cache.repositories); return; }
  refreshInProgress=true; $('#refresh-games').disabled=true;
  if (!cache) setGamesMessage('Carregando jogos da PlumpGames…');
  try {
    const repositories=await fetchRepositories(); saveGamesCache(repositories); officialGames=repositoriesToGames(repositories); renderAllGames(); renderSiteUpdate(repositories);
  } catch (error) {
    if (cache) { officialGames=repositoriesToGames(cache.repositories); renderAllGames(); renderSiteUpdate(cache.repositories); }
    showLoadFailure(Boolean(cache),error.status===403);
  } finally { refreshInProgress=false; $('#refresh-games').disabled=false; }
}

function loadGitHubGames() {
  const cache=loadGamesCache();
  if (cache) { officialGames=repositoriesToGames(cache.repositories); renderAllGames(); renderSiteUpdate(cache.repositories); }
  return refreshGames(false);
}

function appendModalRow(list,label,value) { const row=element('div','game-modal__row'); row.append(element('dt','',label),element('dd','',String(value))); list.append(row); }
function openGameDetails(game) {
  lastFocus=document.activeElement;
  $('#modal-title').textContent=game.name; const content=$('#modal-content'); const actions=$('#modal-actions'); content.replaceChildren(); actions.replaceChildren();
  content.append(element('p','',game.description)); const list=element('dl','game-modal__details');
  appendModalRow(list,'URL do repositório',game.repositoryUrl || 'Indisponível'); appendModalRow(list,'Linguagem',game.language);
  if(game.community){appendModalRow(list,'Criador',game.creator);appendModalRow(list,'Plataforma',game.platform);appendModalRow(list,'Licença',game.license||'Não informada');}
  else appendModalRow(list,'Branch padrão',game.branch);
  appendModalRow(list,'Criação',formatDate(game.createdAt)); appendModalRow(list,'Última atualização',formatDate(game.updatedAt)); appendModalRow(list,'Estrelas',game.stars); appendModalRow(list,'Forks',game.forks); appendModalRow(list,'Tamanho aproximado',`${game.size.toLocaleString('pt-BR')} KB`); content.append(list);
  const playUrl=getGamePlayUrl(game); if(playUrl){const play=element('button','button button--small button--play','▶ Jogar agora');play.type='button';play.addEventListener('click',()=>openGamePage(game));actions.append(play);}
  const download=safeLink('↓ Baixar',game.downloadUrl,true); const github=safeLink('GitHub',game.repositoryUrl); if(download) actions.append(download); if(github) actions.append(github);
  $('#site-modal').hidden=false; document.body.classList.add('modal-open'); lockPageScroll('modal'); $('#site-modal .modal__close').focus();
}

function updateRelativeTimes() { $$('.relative-update[data-updated-at]').forEach(node=>node.textContent=formatRelativeTime(node.dataset.updatedAt)); }
$('#refresh-games').addEventListener('click',()=>refreshGames(true));
setInterval(updateRelativeTimes,60 * 1000);
loadGitHubGames();
loadCommunityGames();

/* Envio público: a persistência é feita exclusivamente pelo Worker + D1. */
const communityDialog=$('#community-dialog'); const communityForm=$('#community-game-form'); let communitySubmitting=false; let metadataRequest=0;
function communityStatus(message,error=false){const area=$('#community-form-status');area.textContent=message;area.classList.toggle('is-error',error);}
function openCommunityDialog(){closePanel({restoreFocus:false});lastFocus=document.activeElement;communityDialog.hidden=false;lockPageScroll('community');setTimeout(()=>communityForm.elements.githubUrl.focus(),0);}
function closeCommunityDialog(){if(communitySubmitting)return;communityDialog.hidden=true;unlockPageScroll('community');lastFocus?.focus();}
$('#open-add-game').addEventListener('click',openCommunityDialog); $$('[data-close-community]').forEach(button=>button.addEventListener('click',closeCommunityDialog));
$('#show-community-games').addEventListener('click',()=>{closePanel({restoreFocus:false});const cards=$$('#games-list [data-catalog]');cards.forEach(card=>card.hidden=card.dataset.catalog!=='community');$('#jogos').scrollIntoView({behavior:preferences.reduceMotion?'auto':'smooth'});setGamesMessage(communityGames.length?'Exibindo jogos da comunidade. Atualize a página para ver todo o catálogo.':'Ainda não há jogos da comunidade.');});
communityForm.elements.githubUrl.addEventListener('change',async event=>{
  const request=++metadataRequest; const match=/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/.exec(event.target.value.trim());
  if(!match){$('#github-preview').textContent='Use uma URL como https://github.com/usuario/repositorio';return;}
  $('#github-preview').textContent='Consultando informações públicas do GitHub…';
  try {const response=await fetch(`https://api.github.com/repos/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`,{headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw new Error();const repo=await response.json();if(request!==metadataRequest)return;
    if(!communityForm.elements.name.value)communityForm.elements.name.value=formatRepositoryName(repo.name);
    if(!communityForm.elements.creator.value)communityForm.elements.creator.value=repo.owner?.login||match[1];
    if(!communityForm.elements.description.value&&repo.description)communityForm.elements.description.value=repo.description.slice(0,1000);
    $('#github-preview').textContent=`${repo.language||'Linguagem não informada'} • ${repo.license?.spdx_id||'licença não informada'} • ${repo.stargazers_count||0} estrelas • atualizado em ${formatDate(repo.updated_at)}`;
  }catch{$('#github-preview').textContent='Não foi possível preencher automaticamente. Confira os dados manualmente.';}
});
communityForm.addEventListener('submit',async event=>{
  event.preventDefault(); if(communitySubmitting||!communityForm.reportValidity())return; communitySubmitting=true;const submit=$('#community-submit');submit.disabled=true;submit.textContent='Enviando…';communityStatus('Enviando…');
  const data=new FormData(communityForm); const payload={name:data.get('name'),creator:data.get('creator'),githubUrl:data.get('githubUrl'),playUrl:data.get('playUrl'),gameType:data.get('gameType'),description:data.get('description'),platform:data.get('platform'),coverUrl:data.get('coverUrl'),confirmed:data.get('confirmed')==='on'};
  try {const response=await fetch('/api/community-games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Não foi possível adicionar o jogo.');communityGames.unshift(normalizeCommunityGame(result.game));renderAllGames();communityStatus('Jogo adicionado com sucesso.');submit.textContent='Ver jogo no catálogo';setTimeout(()=>{communitySubmitting=false;closeCommunityDialog();$('#jogos').scrollIntoView({behavior:'smooth'});communityForm.reset();submit.textContent='Adicionar ao catálogo';submit.disabled=false;},900);return;
  }catch(error){communityStatus(error.message,true);} communitySubmitting=false;submit.disabled=false;submit.textContent='Adicionar ao catálogo';
});

/* PJ Assistant: o navegador envia somente texto e contexto resumido ao Worker. */
const ASSISTANT_GREETING = 'Olá. Sou o assistente da PlumpGames. Como posso ajudar?';
const ASSISTANT_SUGGESTIONS = ['Como jogar?','Como baixar um jogo?','Por que um jogo não abre?','Como usar tela cheia?','Quais jogos estão disponíveis?','Como funcionam os wallpapers?','Como aumentar a letra?','Como parar as animações?','Como deixar os botões maiores?'];
const ASSISTANT_MIN_INTERVAL = 1500;
const assistantState = { history:[], busy:false, lastSentAt:0, opened:false };

function assistantTime() {
  return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date());
}
function addAssistantMessage(role, content, includeHistory = true) {
  const item=element('article',`assistant-message assistant-message--${role}`);
  item.append(element('p','',content));
  const time=element('time','',assistantTime()); time.dateTime=new Date().toISOString(); item.append(time);
  $('#assistant-messages').append(item);
  $('#assistant-messages').scrollTop=$('#assistant-messages').scrollHeight;
  if (includeHistory) assistantState.history.push({role,content:String(content).slice(0,1000)});
  if (role === 'assistant' && $('#plump-assistant-panel').hidden) $('#plump-assistant-button').classList.add('has-update');
}
function resetAssistant() {
  assistantState.history=[];
  $('#assistant-messages').replaceChildren();
  addAssistantMessage('assistant',ASSISTANT_GREETING,false);
  renderAssistantSuggestions();
}
function renderAssistantSuggestions() {
  const area=$('#assistant-suggestions'); area.replaceChildren();
  ASSISTANT_SUGGESTIONS.forEach(question=>{const chip=element('button','',question);chip.type='button';chip.addEventListener('click',()=>sendAssistantMessage(question));area.append(chip);});
}
function openAssistant() {
  const panel=$('#plump-assistant-panel'); panel.hidden=false; assistantState.opened=true;
  $('#plump-assistant-button').setAttribute('aria-expanded','true');
  $('#plump-assistant-button').setAttribute('aria-label','Minimizar PJ Assistant');
  $('#plump-assistant-button').classList.add('is-open'); $('#plump-assistant-button').classList.remove('has-update');
  requestAnimationFrame(()=>$('#assistant-input').focus());
}
function hideAssistant() {
  $('#plump-assistant-panel').hidden=true; $('#plump-assistant-button').setAttribute('aria-expanded','false');
  $('#plump-assistant-button').setAttribute('aria-label','Abrir PJ Assistant'); $('#plump-assistant-button').classList.remove('is-open');
  $('#plump-assistant-button').focus();
}
function localAssistantFallback(message) {
  const text=message.toLocaleLowerCase('pt-BR');
  if (/letra|texto maior|fonte/.test(text)) return 'Abra Menu → Acessibilidade → Baixa visão e ajuste “Tamanho do texto”, ou use o atalho “Texto maior”.';
  if (/vermelho|verde|distinguir cor|daltoni/.test(text)) return 'Abra Menu → Acessibilidade → Daltonismo e escolha uma paleta. O site também pode usar símbolos junto com cores. Isso configura a interface sem fazer diagnóstico.';
  if (/anima|movimento|parar/.test(text)) return 'Abra Menu → Acessibilidade → Sensibilidade a movimento, ou use o atalho “Sem animações”.';
  if (/bot(ão|ao|ões|oes)|controle maior|clicável|clicavel/.test(text)) return 'Abra Menu → Acessibilidade → Dificuldade motora e ative “Modo controles ampliados” para alvos de pelo menos 44 × 44 px.';
  if (/baix|download/.test(text)) return 'No card do jogo, selecione “Baixar” para obter o arquivo pelo GitHub. Se o botão não aparecer, consulte o repositório do projeto.';
  if (/tela cheia|fullscreen/.test(text)) return 'Na aba dedicada do jogo, use o botão “Tela cheia” na barra superior. Pressione Esc para sair.';
  if (/jog|abrir|trav/.test(text)) return 'Escolha um jogo no catálogo e use “Jogar agora”. A página dedicada será aberta em uma nova aba; se o jogo falhar, use “Tentar novamente” ou “Abrir jogo diretamente”.';
  if (/menu|três barr|tres barr/.test(text)) return 'Use o botão de três barras no topo para abrir aparência, wallpapers, visualização dos jogos e acessibilidade.';
  if (/wallpaper|papel de parede|cores?/.test(text)) return 'Abra o menu de três barras, entre em “Live wallpapers” e escolha um fundo. A opção “Usar cores do wallpaper” adapta as cores do site e do PJ Assistant.';
  return 'Não consegui acessar o suporte inteligente agora. Tente novamente em alguns instantes.';
}
function assistantGamesContext() {
  return currentGames.slice(0,12).map(game=>({
    name:String(game.name||'').slice(0,100), description:String(game.description||'').slice(0,240),
    github:isSafeHttpsUrl(game.repositoryUrl,'github.com')?game.repositoryUrl:'', playUrl:getGamePlayUrl(game)
  }));
}
async function sendAssistantMessage(rawMessage) {
  const message=String(rawMessage||'').trim().slice(0,1000);
  if (!message || assistantState.busy) return;
  const elapsed=Date.now()-assistantState.lastSentAt;
  if (elapsed<ASSISTANT_MIN_INTERVAL) { addAssistantMessage('assistant','Aguarde um instante antes de enviar outra mensagem.',false); return; }
  assistantState.lastSentAt=Date.now(); assistantState.busy=true;
  $('#assistant-input').value=''; $('#assistant-send').disabled=true; $('#assistant-typing').hidden=false;
  $('#plump-assistant-button').classList.add('is-thinking'); $('#assistant-suggestions').hidden=true;
  addAssistantMessage('user',message);
  const history=assistantState.history.slice(0,-1).slice(-10);
  try {
    const response=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,games:assistantGamesContext()})});
    if (!response.ok) throw new Error(`Support unavailable: ${response.status}`);
    const payload=await response.json();
    if (!payload || typeof payload.reply!=='string' || !payload.reply.trim()) throw new Error('Invalid support response');
    addAssistantMessage('assistant',payload.reply.trim().slice(0,4000));
  } catch (error) {
    console.warn('PJ Assistant usou o modo local.',error);
    addAssistantMessage('assistant',localAssistantFallback(message));
  } finally {
    assistantState.busy=false; $('#assistant-send').disabled=false; $('#assistant-typing').hidden=true;
    $('#plump-assistant-button').classList.remove('is-thinking');
    if (!$('#plump-assistant-panel').hidden) $('#assistant-input').focus();
  }
}

$('#plump-assistant-button').addEventListener('click',()=>$('#plump-assistant-panel').hidden?openAssistant():hideAssistant());
$('#assistant-minimize').addEventListener('click',hideAssistant); $('#assistant-close').addEventListener('click',hideAssistant);
$('#assistant-clear').addEventListener('click',resetAssistant);
$('#assistant-form').addEventListener('submit',event=>{event.preventDefault();sendAssistantMessage($('#assistant-input').value);});
$('#assistant-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAssistantMessage(event.currentTarget.value);}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#plump-assistant-panel').hidden)hideAssistant();});
resetAssistant();
