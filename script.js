'use strict';

const STORAGE_KEY = 'plumpgames-preferences-v3';
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
  if(!document.hidden&&!wallpaperManager.reduced()&&!gameLauncherState.open) wallpaperManager.active?.play().catch(()=>setStatus('O navegador bloqueou a reprodução.',true));
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
  if (gameLauncherState.open) return;
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
$('[data-open-privacy]').addEventListener('click',()=>showModal('Política de Privacidade','<p>As preferências e o cache de jogos ficam somente no localStorage deste navegador. O site não possui contas nem envia dados pessoais a um banco.</p>'));
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
  'cs1-6html': {
    name: 'CS 1.6 PLH',
    playUrl: 'https://kiwifypurplehero-cell.github.io/CS1-6HTML/'
  }
};
let currentGames = [];
let refreshInProgress = false;
const DISPLAY_SETTINGS_KEY='plumpgamesGameDisplaySettings';
const gameLauncherState={open:false,currentGame:null,currentUrl:'',trigger:null,loading:false,mode:'fit',resolution:'auto',fitMode:'contain',custom:{width:1280,height:720},resizeTimer:0,loadTimer:0,loadSequence:0,frameController:null};
const launcherPopoverState={current:null,trigger:null};
const VIRTUAL_GAMEPAD_MAPPING=Object.freeze({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',a:'z',b:'x',x:'a',y:'s',l1:'q',r1:'e',start:'Enter',select:'Shift'});
const GAMEPAD_SETTINGS_KEY='plumpgamesVirtualGamepadSettings';
const DEFAULT_GAMEPAD_SETTINGS=Object.freeze({layout:'off',size:1,opacity:.7,position:'default',large:false,hidden:[],mapping:{...VIRTUAL_GAMEPAD_MAPPING}});
const virtualGamepadState={settings:{...DEFAULT_GAMEPAD_SETTINGS,mapping:{...VIRTUAL_GAMEPAD_MAPPING}},pressed:new Map(),sameOrigin:false};
let gameDisplaySettings={}; try{gameDisplaySettings=JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY)||'{}');}catch{localStorage.removeItem(DISPLAY_SETTINGS_KEY);}
let virtualGamepadSettings={};try{virtualGamepadSettings=JSON.parse(localStorage.getItem(GAMEPAD_SETTINGS_KEY)||'{}');}catch{localStorage.removeItem(GAMEPAD_SETTINGS_KEY);}
let wasWallpaperPlayingBeforeGame=false, launcherAnimationFrame=0, launcherStartTimer=0;

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
    repositoryUrl, downloadUrl, stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
    forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0, size: Number.isFinite(repo.size) ? repo.size : 0
  };
}

function getGitHubPagesUrl(repo) {
  const name = String(repo?.rawName || repo?.name || '').trim();
  return name ? `https://kiwifypurplehero-cell.github.io/${encodeURIComponent(name)}/` : '';
}

function getGamePlayUrl(repo) {
  const configured = PLAYABLE_REPOSITORIES[String(repo?.rawName || '').toLowerCase()]?.playUrl;
  const candidate = configured || getGitHubPagesUrl(repo);
  return isSafeHttpsUrl(candidate, 'kiwifypurplehero-cell.github.io') ? candidate : '';
}


function measureDisplay(){
  const vv=window.visualViewport, viewportWidth=Math.round(vv?.width||window.innerWidth), viewportHeight=Math.round(vv?.height||window.innerHeight);
  const available=$('#game-available-viewport')?.getBoundingClientRect();
  return {viewportWidth,viewportHeight,screenWidth:Math.round(screen.width),screenHeight:Math.round(screen.height),physicalWidth:Math.round(screen.width*(devicePixelRatio||1)),physicalHeight:Math.round(screen.height*(devicePixelRatio||1)),availableWidth:Math.max(1,Math.round(available?.width||viewportWidth)),availableHeight:Math.max(1,Math.round(available?.height||viewportHeight))};
}
function selectedDimensions(metrics){
  if(gameLauncherState.resolution==='current'||gameLauncherState.resolution==='auto')return [metrics.availableWidth,metrics.availableHeight];
  if(gameLauncherState.resolution==='screen')return [metrics.screenWidth,metrics.screenHeight];
  if(gameLauncherState.resolution==='custom')return [gameLauncherState.custom.width,gameLauncherState.custom.height];
  return gameLauncherState.resolution.split('x').map(Number);
}
function updateResolutionLabels(){
  const m=measureDisplay(), current=$('[data-resolution="current"]'), screenOption=$('[data-resolution="screen"]');
  if(current)current.textContent=`Resolução atual — ${m.availableWidth} × ${m.availableHeight}`;
  if(screenOption)screenOption.textContent=`Tela — ${m.screenWidth} × ${m.screenHeight} CSS px (≈ ${m.physicalWidth} × ${m.physicalHeight} físicos)`;
}
function applyGameDisplay(){
  if(!gameLauncherState.open)return; const m=measureDisplay(), stage=$('#game-resolution-stage'), canvas=$('#game-resolution-canvas'), [width,height]=selectedDimensions(m);
  const fixed=!['auto','current'].includes(gameLauncherState.resolution); canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  let scale=1,scaleX=1,scaleY=1;
  if(fixed){scale=Math.min(m.availableWidth/width,m.availableHeight/height); if(gameLauncherState.fitMode==='cover')scale=Math.max(m.availableWidth/width,m.availableHeight/height); if(gameLauncherState.fitMode==='stretch'){scaleX=m.availableWidth/width;scaleY=m.availableHeight/height;}else scaleX=scaleY=scale;}
  canvas.style.transform=`scale(${scaleX},${scaleY})`; stage.dataset.fit=gameLauncherState.fitMode; stage.dataset.fixed=String(fixed);
  $('#game-launcher-container').classList.toggle('is-window',gameLauncherState.mode==='window');
  $('#game-orientation-hint').hidden=!(m.viewportWidth<700&&m.viewportHeight>m.viewportWidth&&width/height>1.4);
  updateResolutionLabels();updateResolutionButton();
}
function saveGameDisplay(){const key=String(gameLauncherState.currentGame?.rawName||gameLauncherState.currentGame?.id||'');if(!key)return;gameDisplaySettings[key]={mode:gameLauncherState.mode,resolution:gameLauncherState.resolution,fitMode:gameLauncherState.fitMode,custom:gameLauncherState.custom};localStorage.setItem(DISPLAY_SETTINGS_KEY,JSON.stringify(gameDisplaySettings));}
function restoreGameDisplay(game){const key=String(game.rawName||game.id||''),stored=gameDisplaySettings[key]||{};Object.assign(gameLauncherState,{mode:stored.mode||'fit',resolution:stored.resolution||'auto',fitMode:stored.fitMode||'contain',custom:stored.custom||{width:1280,height:720}});}
function getPopover(id){return document.getElementById(id);}
function positionLauncherPopover(popover,trigger){
  if(!popover||!trigger)return;const shell=$('#game-launcher-container'),shellRect=shell.getBoundingClientRect(),buttonRect=trigger.getBoundingClientRect(),gap=8;
  popover.classList.toggle('launcher-popover--sheet',matchMedia('(max-width: 700px)').matches);
  if(matchMedia('(max-width: 700px)').matches){popover.style.left='8px';popover.style.right='8px';popover.style.top='auto';popover.style.bottom='8px';return;}
  const width=Math.min(360,window.innerWidth-20),estimatedHeight=Math.min(popover.scrollHeight||420,window.innerHeight-20);
  const left=Math.max(10,Math.min(buttonRect.right-width-shellRect.left,shellRect.width-width-10));
  const below=buttonRect.bottom-shellRect.top+gap,above=buttonRect.top-shellRect.top-estimatedHeight-gap;
  popover.style.left=`${left}px`;popover.style.right='auto';popover.style.bottom='auto';popover.style.top=`${below+estimatedHeight<=shellRect.height-8?below:Math.max(8,above)}px`;
}
function setIframeInteractionOverlay(active){const overlay=$('#iframe-interaction-overlay');if(!overlay)return;overlay.hidden=!active;overlay.style.pointerEvents=active?'auto':'none';}
function openLauncherPopover(id,trigger=document.querySelector(`[aria-controls="${id}"]`)){
  if(launcherPopoverState.current&&launcherPopoverState.current!==id)closeLauncherPopover();
  const popover=getPopover(id);if(!popover)return;launcherPopoverState.current=id;launcherPopoverState.trigger=trigger;popover.hidden=false;
  trigger?.setAttribute('aria-expanded','true');setIframeInteractionOverlay(true);requestAnimationFrame(()=>positionLauncherPopover(popover,trigger));
}
function closeLauncherPopover({restoreFocus=false}={}){
  const {current,trigger}=launcherPopoverState;if(current)getPopover(current).hidden=true;
  document.querySelectorAll('.game-launcher__toolbar [aria-expanded]').forEach(button=>button.setAttribute('aria-expanded','false'));
  launcherPopoverState.current=null;launcherPopoverState.trigger=null;setIframeInteractionOverlay(false);if(restoreFocus&&trigger?.isConnected)trigger.focus();
}
function toggleLauncherPopover(id,trigger){if(launcherPopoverState.current===id)closeLauncherPopover({restoreFocus:true});else openLauncherPopover(id,trigger);}
function closeDisplayMenu(){closeLauncherPopover();}
function resolutionLabel(){const m=measureDisplay(),value=gameLauncherState.resolution;if(value==='auto')return 'Automático / Ajustado';if(value==='current')return `Atual ${m.availableWidth} × ${m.availableHeight}`;if(value==='screen')return `Tela ${m.screenWidth} × ${m.screenHeight}`;if(value==='custom')return `${gameLauncherState.custom.width} × ${gameLauncherState.custom.height}`;return value.replace('x',' × ');}
function updateResolutionButton(){$('#game-resolution-label').textContent=resolutionLabel();}
function renderDisplayMenu(kind,trigger){
  const menu=$('#game-display-menu'); menu.dataset.kind=kind;
  if(kind==='mode') menu.innerHTML=`<strong>Ajuste</strong><button data-mode="fit">Ajustado</button><button data-mode="window">Janela</button><strong>Escala</strong><button data-fit="contain">Conter</button><button data-fit="cover">Preencher</button><button data-fit="stretch">Esticar <small>Pode distorcer a imagem.</small></button>`;
  else menu.innerHTML=`<strong>AJUSTE</strong><button data-resolution="auto">Automático / Ajustado</button><strong>DISPOSITIVO</strong><button data-resolution="current"></button><button data-resolution="screen"></button><strong>WIDESCREEN 16:9</strong>${['1920x1080','1600x900','1366x768','1280x720'].map(x=>`<button data-resolution="${x}">${x.replace('x',' × ')}</button>`).join('')}<strong>CLÁSSICO 4:3</strong>${['1280x960','1024x768','800x600','640x480'].map(x=>`<button data-resolution="${x}">${x.replace('x',' × ')}</button>`).join('')}<strong>5:4</strong><button data-resolution="1280x1024">1280 × 1024</button><strong>PERSONALIZADO</strong><button data-resolution="custom">Definir resolução…</button>`;
  updateResolutionLabels();toggleLauncherPopover('game-display-menu',trigger);if(launcherPopoverState.current==='game-display-menu')menu.querySelector('button')?.focus();
}
function customResolution(){
  const width=Number(prompt('Largura (320–7680):',gameLauncherState.custom.width));if(!width)return;
  const height=Number(prompt('Altura (240–4320):',gameLauncherState.custom.height));if(!height)return;
  if(width<320||width>7680||height<240||height>4320){alert('Use valores entre 320 × 240 e 7680 × 4320.');return;}
  gameLauncherState.custom={width:Math.round(width),height:Math.round(height)};gameLauncherState.resolution='custom';saveGameDisplay();applyGameDisplay();
}
function gameSettingsKey(){return String(gameLauncherState.currentGame?.rawName||gameLauncherState.currentGame?.id||'');}
function restoreVirtualGamepad(){const stored=virtualGamepadSettings[gameSettingsKey()]||{};virtualGamepadState.settings={...DEFAULT_GAMEPAD_SETTINGS,...stored,hidden:Array.isArray(stored.hidden)?stored.hidden:[],mapping:{...VIRTUAL_GAMEPAD_MAPPING,...stored.mapping}};renderVirtualGamepad();}
function saveVirtualGamepad(){if(!gameSettingsKey())return;virtualGamepadSettings[gameSettingsKey()]={...virtualGamepadState.settings,mapping:{...virtualGamepadState.settings.mapping}};localStorage.setItem(GAMEPAD_SETTINGS_KEY,JSON.stringify(virtualGamepadSettings));}
function keyboardTargets(){const frame=$('#game-frame'),targets=[window,document];virtualGamepadState.sameOrigin=false;try{const frameDocument=frame?.contentDocument;if(frameDocument){virtualGamepadState.sameOrigin=true;targets.unshift(frame.contentWindow,frameDocument,frameDocument.body);}}catch{virtualGamepadState.sameOrigin=false;}return targets.filter(Boolean);}
function dispatchVirtualKey(type,key){const options={key,code:key.length===1?`Key${key.toUpperCase()}`:key,bubbles:true,cancelable:true};keyboardTargets().forEach(target=>target.dispatchEvent(new KeyboardEvent(type,options)));if(!virtualGamepadState.sameOrigin)$('#game-frame')?.focus();}
function releaseVirtualControls(){virtualGamepadState.pressed.forEach(key=>dispatchVirtualKey('keyup',key));virtualGamepadState.pressed.clear();document.querySelectorAll('.gamepad-button.is-pressed').forEach(button=>button.classList.remove('is-pressed'));}
function gamepadButton(id,label,text){return `<button class="gamepad-button gamepad-button--${id}" type="button" data-gamepad-button="${id}" aria-label="${label}">${text}</button>`;}
function renderVirtualGamepad(){
  const overlay=$('#virtual-gamepad'),settings=virtualGamepadState.settings;releaseVirtualControls();overlay.hidden=settings.layout==='off';overlay.dataset.layout=settings.layout;overlay.dataset.position=settings.position;overlay.style.setProperty('--gamepad-size',String(settings.size*((settings.large||document.documentElement.classList.contains('a11y-motor'))?1.2:1)));overlay.style.setProperty('--gamepad-opacity',String(settings.opacity));
  if(settings.layout==='off'){overlay.replaceChildren();return;}const visible=id=>!settings.hidden.includes(id);
  const dpad=`<div class="gamepad-cluster gamepad-dpad">${visible('up')?gamepadButton('up','Direcional para cima','↑'):''}${visible('left')?gamepadButton('left','Direcional para esquerda','←'):''}${visible('down')?gamepadButton('down','Direcional para baixo','↓'):''}${visible('right')?gamepadButton('right','Direcional para direita','→'):''}</div>`;
  const face=settings.layout==='dpad'?'':`<div class="gamepad-cluster gamepad-face">${settings.layout==='classic'&&visible('y')?gamepadButton('y','Botão Y','Y'):''}${settings.layout==='classic'&&visible('x')?gamepadButton('x','Botão X','X'):''}${visible('b')?gamepadButton('b','Botão B','B'):''}${visible('a')?gamepadButton('a','Botão A','A'):''}</div>`;
  const shoulders=settings.layout==='classic'?`<div class="gamepad-shoulders">${visible('l1')?gamepadButton('l1','Botão L1','L1'):''}${visible('r1')?gamepadButton('r1','Botão R1','R1'):''}</div>`:'';
  const center=settings.layout==='dpad'?'':`<div class="gamepad-center">${settings.layout==='classic'&&visible('select')?gamepadButton('select','Select','Select'):''}${visible('start')?gamepadButton('start','Start','Start'):''}</div>`;
  overlay.innerHTML=shoulders+dpad+face+center;
}
function setGamepadLayout(layout){virtualGamepadState.settings.layout=layout==='custom'?'classic':layout;saveVirtualGamepad();renderVirtualGamepad();renderControlsMenu();closeLauncherPopover();showToast(layout==='off'?'Controles virtuais desativados.':virtualGamepadState.sameOrigin?'Controles virtuais ativados.':'Controles ativados. Em jogos de outra origem, o teclado virtual pode ser bloqueado pelo navegador.');}
function renderControlsMenu(){
  const menu=$('#game-controls-menu'),s=virtualGamepadState.settings,layouts=[['off','Desativado'],['classic','Gamepad clássico'],['compact','Gamepad compacto'],['dpad','Somente direcional']];
  menu.innerHTML=`<strong>CONTROLES VIRTUAIS</strong>${layouts.map(([id,label])=>`<button data-gamepad-layout="${id}" aria-pressed="${s.layout===id}">${label}</button>`).join('')}<button data-gamepad-custom>Personalizado</button><div class="gamepad-custom-settings" ${menu.dataset.custom==='true'?'':'hidden'}><label>Opacidade dos controles <output>${Math.round(s.opacity*100)}%</output><input data-gamepad-opacity type="range" min="30" max="100" value="${Math.round(s.opacity*100)}"></label><label>Tamanho <input data-gamepad-size type="range" min="70" max="150" value="${Math.round(s.size*100)}"></label><label><input data-gamepad-large type="checkbox" ${s.large?'checked':''}> Controles ampliados</label><label>Posição <select data-gamepad-position><option value="default">Automática</option><option value="low">Mais abaixo</option><option value="high">Mais acima</option></select></label><fieldset><legend>Botões visíveis</legend>${['a','b','x','y','l1','r1','start','select'].map(id=>`<label><input data-gamepad-visible="${id}" type="checkbox" ${s.hidden.includes(id)?'':'checked'}> ${id.toUpperCase()}</label>`).join('')}</fieldset><fieldset><legend>Mapeamento</legend>${Object.entries(s.mapping).map(([id,key])=>`<label>${id.toUpperCase()} <input data-gamepad-map="${id}" value="${key}" maxlength="12"></label>`).join('')}</fieldset><button data-gamepad-reset>Restaurar padrão</button><small>Eventos de teclado são enviados diretamente apenas para jogos da mesma origem. Em jogos externos, o navegador impede a injeção; o iframe recebe foco, mas a Gamepad API não permite registrar controles virtuais reais.</small></div>`;
  menu.querySelector('[data-gamepad-position]')?.querySelector(`option[value="${s.position}"]`)?.setAttribute('selected','');
}
function openControlsMenu(trigger){renderControlsMenu();toggleLauncherPopover('game-controls-menu',trigger);}
function stopGameFrame(){releaseVirtualControls();cancelAnimationFrame(launcherAnimationFrame);clearTimeout(launcherStartTimer);clearTimeout(gameLauncherState.loadTimer);gameLauncherState.frameController?.abort();gameLauncherState.frameController=null;launcherAnimationFrame=0;launcherStartTimer=0;gameLauncherState.loadTimer=0;++gameLauncherState.loadSequence;const frame=$('#game-frame');if(frame){frame.src='about:blank';frame.remove();}virtualGamepadState.sameOrigin=false;}
function setLauncherLoading(loading,{message='Carregando jogo…',detail='Preparando o launcher…',error=false}={}){gameLauncherState.loading=loading;const view=$('#game-loading');if(!view)return;view.classList.remove('is-leaving');view.classList.toggle('is-error',error);view.hidden=!loading;view.querySelector('strong').textContent=message;$('#game-loading-detail').textContent=detail;$('#game-loading-actions').hidden=!error;}
function showLauncherError(sequence,detail){if(!gameLauncherState.open||sequence!==gameLauncherState.loadSequence)return;clearTimeout(gameLauncherState.loadTimer);setLauncherLoading(true,{message:'Não foi possível iniciar o jogo',detail,error:true});console.error('[launcher] error',{url:gameLauncherState.currentUrl,detail});}
function finishFrameLoading(sequence,frame){if(!gameLauncherState.open||sequence!==gameLauncherState.loadSequence||frame!==$('#game-frame'))return;clearTimeout(gameLauncherState.loadTimer);gameLauncherState.loadTimer=0;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!gameLauncherState.open||sequence!==gameLauncherState.loadSequence)return;const view=$('#game-loading');view.classList.add('is-leaving');view.addEventListener('transitionend',()=>setLauncherLoading(false),{once:true});if(matchMedia('(prefers-reduced-motion: reduce)').matches)setLauncherLoading(false);frame.focus();console.info('[launcher] iframe loaded',{url:gameLauncherState.currentUrl});}));}
function handleFrameLoad(sequence,frame){if(sequence!==gameLauncherState.loadSequence)return;try{const doc=frame.contentDocument;if(doc&&doc.readyState!=='complete'){doc.addEventListener('readystatechange',()=>{if(doc.readyState==='complete')finishFrameLoading(sequence,frame);},{once:true,signal:gameLauncherState.frameController.signal});return;}if(doc?.fonts?.ready){doc.fonts.ready.then(()=>finishFrameLoading(sequence,frame),()=>finishFrameLoading(sequence,frame));return;}}catch{/* O onload é o sinal disponível para iframes de outra origem. */}finishFrameLoading(sequence,frame);}
async function diagnoseGameUrl(url,sequence,signal){try{const response=await fetch(url,{method:'HEAD',cache:'no-store',signal});if(!response.ok){showLauncherError(sequence,`O servidor do jogo respondeu com HTTP ${response.status}. Verifique a publicação no GitHub Pages.`);return;}const xfo=response.headers.get('x-frame-options')?.toLowerCase()||'',csp=response.headers.get('content-security-policy')?.toLowerCase()||'';if(xfo==='deny'||xfo==='sameorigin'&&new URL(url).origin!==location.origin||/frame-ancestors\s+[^;]*(?:'none'|'self')/.test(csp)&&new URL(url).origin!==location.origin)showLauncherError(sequence,'O servidor não permite abrir este jogo dentro de um iframe (CSP/X-Frame-Options).');}catch(error){if(error.name!=='AbortError')console.warn('[launcher] Não foi possível concluir o diagnóstico HTTP; o iframe continuará carregando.');}}
function createAndLoadGameFrame(url,sequence){const canvas=$('#game-resolution-canvas');if(!canvas)throw new Error('A área do jogo não foi encontrada.');gameLauncherState.frameController?.abort();const controller=new AbortController();gameLauncherState.frameController=controller;const frame=document.createElement('iframe');frame.id='game-frame';frame.title=gameLauncherState.currentGame?.name||'Jogo';frame.allow='fullscreen; autoplay; gamepad; clipboard-read; clipboard-write';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.addEventListener('load',()=>handleFrameLoad(sequence,frame),{signal:controller.signal});frame.addEventListener('error',()=>showLauncherError(sequence,'O navegador informou uma falha ao carregar o iframe.'),{signal:controller.signal});canvas.replaceChildren(frame);console.info('[launcher] iframe created',{sequence});setLauncherLoading(true,{message:'Carregando jogo…',detail:'Aguardando o jogo ficar pronto…'});frame.src=url;diagnoseGameUrl(url,sequence,controller.signal);console.info('[launcher] loading URL',{url,sequence});gameLauncherState.loadTimer=setTimeout(()=>showLauncherError(sequence,'O jogo não respondeu. A página pode estar indisponível, retornar 404 ou bloquear incorporação por CSP/X-Frame-Options.'),20000);}
async function closeGameLauncher({returnToGames=true}={}){
  const trigger=gameLauncherState.trigger;if(document.fullscreenElement&&document.exitFullscreen)try{await document.exitFullscreen();}catch(error){console.warn('Não foi possível sair da tela cheia.',error);}
  clearTimeout(gameLauncherState.resizeTimer);window.removeEventListener('resize',scheduleGameDisplay);window.removeEventListener('orientationchange',scheduleGameDisplay);window.visualViewport?.removeEventListener('resize',scheduleGameDisplay);document.removeEventListener('fullscreenchange',applyGameDisplay);
  closeLauncherPopover();stopGameFrame();virtualGamepadState.settings.layout='off';renderVirtualGamepad();setLauncherLoading(false);$('#game-launcher').hidden=true;document.body.classList.remove('game-open','launcher-open');document.documentElement.classList.remove('game-open','launcher-open');unlockPageScroll('launcher');
  Object.assign(gameLauncherState,{open:false,currentGame:null,currentUrl:'',trigger:null,loading:false,mode:'fit',resolution:'auto',fitMode:'contain'});if(wasWallpaperPlayingBeforeGame)resumeWallpaper();wasWallpaperPlayingBeforeGame=false;if(returnToGames&&trigger?.isConnected)trigger.focus();resetTransientUIState();
}
async function openGameLauncher(game,trigger=document.activeElement){
  const required=['#game-launcher','#game-resolution-canvas','#game-loading','#game-launcher-title'];const missing=required.filter(selector=>!$(selector));if(missing.length){console.error('[launcher] error',{missing});showToast('Não foi possível abrir o launcher. Atualize a página e tente novamente.');return false;}
  const modalWasOpen=!$('#site-modal').hidden,focusReturn=modalWasOpen&&lastFocus?.isConnected?lastFocus:trigger;if(gameLauncherState.open)await closeGameLauncher({returnToGames:false});if(!$('#gx-side-panel').hidden)closePanel({restoreFocus:false});if(modalWasOpen)closeModal();closeLauncherPopover();releaseVirtualControls();Object.assign(gameLauncherState,{open:true,currentGame:game,currentUrl:'',trigger:focusReturn,loading:true});restoreGameDisplay(game);restoreVirtualGamepad();
  const sequence=++gameLauncherState.loadSequence;$('#game-launcher-title').textContent=game.name||'Jogo';setLauncherLoading(true,{message:'Preparando o launcher…',detail:'Resolvendo a URL do jogo…'});$('#game-launcher').hidden=false;document.body.classList.add('game-open','launcher-open');document.documentElement.classList.add('game-open','launcher-open');lockPageScroll('launcher');
  if(matchMedia('(pointer: coarse)').matches&&virtualGamepadState.settings.layout==='off'&&!sessionStorage.getItem('gamepadSuggestionShown')){showToast('Dica: ative Controles para usar um gamepad virtual na tela.');sessionStorage.setItem('gamepadSuggestionShown','1');}wasWallpaperPlayingBeforeGame=Boolean(wallpaperManager.active&&!wallpaperManager.active.paused);pauseWallpaper(false);window.addEventListener('resize',scheduleGameDisplay);window.addEventListener('orientationchange',scheduleGameDisplay);window.visualViewport?.addEventListener('resize',scheduleGameDisplay);document.addEventListener('fullscreenchange',applyGameDisplay);
  console.info('[launcher] opening',{game:game.name,sequence});applyGameDisplay();$('#game-back').focus();launcherAnimationFrame=requestAnimationFrame(()=>{if(!gameLauncherState.open||sequence!==gameLauncherState.loadSequence)return;console.info('[launcher] resolving game URL',{game:game.rawName||game.name});const playUrl=getGamePlayUrl(game);if(!playUrl){showLauncherError(sequence,'A URL publicada do jogo é inválida ou não usa HTTPS.');return;}gameLauncherState.currentUrl=playUrl;['#game-external','#game-direct','#game-loading-external'].forEach(selector=>$(selector).href=playUrl);try{createAndLoadGameFrame(playUrl,sequence);}catch(error){showLauncherError(sequence,error.message);}});return true;
}
function scheduleGameDisplay(){clearTimeout(gameLauncherState.resizeTimer);gameLauncherState.resizeTimer=setTimeout(applyGameDisplay,120);}
function restartGame(){if(!gameLauncherState.open||!gameLauncherState.currentUrl)return;const src=gameLauncherState.currentUrl;stopGameFrame();const sequence=gameLauncherState.loadSequence;setLauncherLoading(true,{message:'Reiniciando…',detail:'Preparando o launcher…'});launcherAnimationFrame=requestAnimationFrame(()=>{if(gameLauncherState.open&&sequence===gameLauncherState.loadSequence)createAndLoadGameFrame(src,sequence);});}
async function openGameFullscreen(){if(!gameLauncherState.open)return;const container=$('#game-launcher-container');if(!document.fullscreenElement&&container.requestFullscreen)try{await container.requestFullscreen();}catch(error){console.warn('Tela cheia indisponível.',error);}else if(document.fullscreenElement)await document.exitFullscreen();}
function resetTransientUIState(){if(!gameLauncherState.open){$('#game-launcher').hidden=true;setLauncherLoading(false);document.body.classList.remove('game-open','launcher-open');document.documentElement.classList.remove('game-open','launcher-open');unlockPageScroll('launcher');}if($('#gx-side-panel').hidden){document.body.classList.remove('panel-open');$('#gx-panel-backdrop').hidden=true;$('#gx-menu-button').setAttribute('aria-expanded','false');unlockPageScroll('menu');}}

function openGameExternal() {
  if (gameLauncherState.open) window.open(gameLauncherState.currentUrl, '_blank', 'noopener,noreferrer');
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
  const status = element('span','status',game.status);
  const initials = game.name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('pt-BR') || 'PG';
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
  const card = element('article','game-card game-card--featured');
  card.dataset.repositoryId=game.id;
  const body=element('div','game-card__body');
  body.append(element('p','card-kicker',`${game.language} • ${game.status}`), element('h3','',game.name), element('p','',game.description));
  const details=element('dl','game-details');
  details.append(detailItem('Linguagem',game.language), detailItem('Branch padrão',game.branch), detailItem('Última atualização',formatDate(game.updatedAt)), detailItem('Status',game.status), detailItem('Atualização relativa',formatRelativeTime(game.updatedAt),game.updatedAt));
  body.append(details);
  const compactMeta=element('p','compact-meta');
  const compactRelative=element('span','relative-update',formatRelativeTime(game.updatedAt)); compactRelative.dataset.updatedAt=game.updatedAt;
  compactMeta.append(element('span','',game.language),compactRelative); body.append(compactMeta);
  const actions=element('div','card-actions');
  const playUrl=getGamePlayUrl(game);
  if (playUrl) { const play=element('button','button button--small button--play','▶ Jogar agora'); play.type='button'; play.addEventListener('click',event=>openGameLauncher(game,event.currentTarget)); actions.append(play); }
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
  if (!force && cache?.valid) { renderGames(repositoriesToGames(cache.repositories)); renderSiteUpdate(cache.repositories); return; }
  refreshInProgress=true; $('#refresh-games').disabled=true;
  if (!cache) setGamesMessage('Carregando jogos da PlumpGames…');
  try {
    const repositories=await fetchRepositories(); saveGamesCache(repositories); renderGames(repositoriesToGames(repositories)); renderSiteUpdate(repositories);
  } catch (error) {
    if (cache) { renderGames(repositoriesToGames(cache.repositories)); renderSiteUpdate(cache.repositories); }
    showLoadFailure(Boolean(cache),error.status===403);
  } finally { refreshInProgress=false; $('#refresh-games').disabled=false; }
}

function loadGitHubGames() {
  const cache=loadGamesCache();
  if (cache) { renderGames(repositoriesToGames(cache.repositories)); renderSiteUpdate(cache.repositories); }
  return refreshGames(false);
}

function appendModalRow(list,label,value) { const row=element('div','game-modal__row'); row.append(element('dt','',label),element('dd','',String(value))); list.append(row); }
function openGameDetails(game) {
  lastFocus=document.activeElement;
  $('#modal-title').textContent=game.name; const content=$('#modal-content'); const actions=$('#modal-actions'); content.replaceChildren(); actions.replaceChildren();
  content.append(element('p','',game.description)); const list=element('dl','game-modal__details');
  appendModalRow(list,'URL do repositório',game.repositoryUrl || 'Indisponível'); appendModalRow(list,'Linguagem',game.language); appendModalRow(list,'Branch padrão',game.branch);
  appendModalRow(list,'Criação',formatDate(game.createdAt)); appendModalRow(list,'Última atualização',formatDate(game.updatedAt)); appendModalRow(list,'Estrelas',game.stars); appendModalRow(list,'Forks',game.forks); appendModalRow(list,'Tamanho aproximado',`${game.size.toLocaleString('pt-BR')} KB`); content.append(list);
  const playUrl=getGamePlayUrl(game); if(playUrl){const play=element('button','button button--small button--play','▶ Jogar agora');play.type='button';play.addEventListener('click',event=>openGameLauncher(game,event.currentTarget));actions.append(play);}
  const download=safeLink('↓ Baixar',game.downloadUrl,true); const github=safeLink('GitHub',game.repositoryUrl); if(download) actions.append(download); if(github) actions.append(github);
  $('#site-modal').hidden=false; document.body.classList.add('modal-open'); lockPageScroll('modal'); $('#site-modal .modal__close').focus();
}

function updateRelativeTimes() { $$('.relative-update[data-updated-at]').forEach(node=>node.textContent=formatRelativeTime(node.dataset.updatedAt)); }
$('#refresh-games').addEventListener('click',()=>refreshGames(true));
window.addEventListener('message',event=>{const frame=$('#game-frame');if(!gameLauncherState.open||event.source!==frame?.contentWindow)return;const ready=event.data==='plumpgames:ready'||event.data?.type==='plumpgames:ready';if(ready)finishFrameLoading(gameLauncherState.loadSequence,frame);});
$('#game-back').addEventListener('click',closeGameLauncher);
$('#game-loading-back').addEventListener('click',closeGameLauncher);
$('#game-loading-retry').addEventListener('click',restartGame);
$('#game-restart').addEventListener('click',restartGame);
$('#game-fullscreen').addEventListener('click',()=>{closeLauncherPopover();openGameFullscreen();});
$('#game-mode').addEventListener('click',event=>renderDisplayMenu('mode',event.currentTarget));$('#game-resolution').addEventListener('click',event=>renderDisplayMenu('resolution',event.currentTarget));$('#game-controls').addEventListener('click',event=>openControlsMenu(event.currentTarget));
$('#game-display-menu').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.mode)gameLauncherState.mode=button.dataset.mode;if(button.dataset.fit)gameLauncherState.fitMode=button.dataset.fit;if(button.dataset.resolution){if(button.dataset.resolution==='custom')customResolution();else gameLauncherState.resolution=button.dataset.resolution;}saveGameDisplay();closeLauncherPopover();applyGameDisplay();});
$('#game-controls-menu').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.gamepadLayout)setGamepadLayout(button.dataset.gamepadLayout);if(button.hasAttribute('data-gamepad-custom')){event.currentTarget.dataset.custom=event.currentTarget.dataset.custom==='true'?'false':'true';renderControlsMenu();positionLauncherPopover(event.currentTarget,$('#game-controls'));}if(button.hasAttribute('data-gamepad-reset')){virtualGamepadState.settings={...DEFAULT_GAMEPAD_SETTINGS,mapping:{...VIRTUAL_GAMEPAD_MAPPING},layout:'classic'};saveVirtualGamepad();renderVirtualGamepad();renderControlsMenu();}});
$('#game-controls-menu').addEventListener('input',event=>{const input=event.target,s=virtualGamepadState.settings;if(input.matches('[data-gamepad-opacity]'))s.opacity=Number(input.value)/100;if(input.matches('[data-gamepad-size]'))s.size=Number(input.value)/100;if(input.matches('[data-gamepad-large]'))s.large=input.checked;if(input.matches('[data-gamepad-position]'))s.position=input.value;if(input.matches('[data-gamepad-visible]'))s.hidden=input.checked?s.hidden.filter(id=>id!==input.dataset.gamepadVisible):[...new Set([...s.hidden,input.dataset.gamepadVisible])];if(input.matches('[data-gamepad-map]')&&input.value.trim())s.mapping[input.dataset.gamepadMap]=input.value.trim();saveVirtualGamepad();renderVirtualGamepad();const output=$('#game-controls-menu output');if(output)output.textContent=`${Math.round(s.opacity*100)}%`;});
$('#virtual-gamepad').addEventListener('pointerdown',event=>{const button=event.target.closest('[data-gamepad-button]');if(!button)return;event.preventDefault();button.setPointerCapture?.(event.pointerId);const key=virtualGamepadState.settings.mapping[button.dataset.gamepadButton];virtualGamepadState.pressed.set(event.pointerId,key);button.classList.add('is-pressed');dispatchVirtualKey('keydown',key);});
function releaseGamepadPointer(event){const button=event.target.closest('[data-gamepad-button]'),key=virtualGamepadState.pressed.get(event.pointerId);if(!key)return;event.preventDefault();virtualGamepadState.pressed.delete(event.pointerId);button?.classList.remove('is-pressed');dispatchVirtualKey('keyup',key);}
['pointerup','pointercancel','pointerleave'].forEach(type=>$('#virtual-gamepad').addEventListener(type,releaseGamepadPointer));
$('#iframe-interaction-overlay').addEventListener('pointerdown',event=>{event.preventDefault();closeLauncherPopover();requestAnimationFrame(()=>$('#game-frame')?.focus());});
document.addEventListener('pointerdown',event=>{if(!launcherPopoverState.current)return;const path=typeof event.composedPath==='function'?event.composedPath():[];const popover=getPopover(launcherPopoverState.current),trigger=launcherPopoverState.trigger;const inside=path.length?(path.includes(popover)||path.includes(trigger)):(popover?.contains(event.target)||trigger?.contains(event.target));if(inside)return;closeLauncherPopover();},{capture:true});
$('#game-external').addEventListener('click',event=>{ if(!gameLauncherState.open) event.preventDefault(); });
$('#game-direct').addEventListener('click',event=>{ if(!gameLauncherState.open) event.preventDefault(); });
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||$('#game-launcher').hidden)return;if(launcherPopoverState.current){event.preventDefault();event.stopImmediatePropagation();closeLauncherPopover({restoreFocus:true});return;}if(document.activeElement!==$('#game-frame'))closeGameLauncher();});
setInterval(updateRelativeTimes,60 * 1000);
loadGitHubGames();

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
  if (/tela cheia|fullscreen/.test(text)) return 'Com o jogo aberto no launcher, use o botão “Tela cheia” na barra superior. Pressione Esc para sair da tela cheia.';
  if (/jog|abrir|trav/.test(text)) return 'Escolha um jogo no catálogo e use “Jogar agora”. Se ele não carregar, tente “Nova aba”, atualize a página ou verifique sua conexão.';
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
