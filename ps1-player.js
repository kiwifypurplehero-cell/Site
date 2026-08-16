import {downloadPs1Content, fetchPs1Game, resolvePs1Launch} from './ps1-utils.js';

const DATA = 'https://cdn.emulatorjs.org/stable/data/';
const query = new URLSearchParams(location.search);
const gameId = query.get('game') || '';
const debugEnabled = query.has('debug');
const $ = selector => document.querySelector(selector);
let game, objectUrl, raf, sampleStart, frames = 0, dropped = 0, lastFrame, renderedFps = 0, loadController, renderTimer, runToken = 0;
export const ps1LoadState = {phase:'preparing',loadedBytes:0,totalBytes:0,percent:0,speedBps:0,etaSeconds:null,currentFile:null,error:null};
const capabilities = {
  logicalProcessors: navigator.hardwareConcurrency || 'indisponível', deviceMemory: navigator.deviceMemory || 'indisponível',
  crossOriginIsolated: window.crossOriginIsolated, sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  webAssembly: typeof WebAssembly !== 'undefined', webgl2: Boolean(document.createElement('canvas').getContext('webgl2'))
};
const deviceProfile = (() => { const cpu = navigator.hardwareConcurrency || 4, ram = navigator.deviceMemory || 4; return cpu <= 4 || ram <= 4 ? 'low' : cpu >= 8 && ram >= 6 ? 'high' : 'medium'; })();
const saved = (() => { try { return JSON.parse(localStorage.getItem('ps1PerformanceProfile') || '{}'); } catch { return {}; } })();
$('#profile').value = saved.profile || 'auto'; $('#frameskip').value = saved.frameskip || (deviceProfile === 'high' ? '0' : 'auto'); $('#audio').value = saved.audio || (deviceProfile === 'low' ? 'stable' : 'balanced');

function coreOptions() {
  const maximum = $('#profile').value === 'maximum' || ($('#profile').value === 'auto' && deviceProfile === 'low');
  return {
    pcsx_rearmed_drc: 'enabled', pcsx_rearmed_neon_enhancement_enable: 'disabled',
    pcsx_rearmed_duping_enable: maximum || deviceProfile !== 'high' ? 'enabled' : 'disabled',
    pcsx_rearmed_frameskip: $('#frameskip').value === 'auto' ? '0' : $('#frameskip').value,
    pcsx_rearmed_gpu_thread_rendering: 'disabled', pcsx_rearmed_psxclock: '57'
  };
}
function persist() { localStorage.setItem('ps1PerformanceProfile', JSON.stringify({profile: $('#profile').value, frameskip: $('#frameskip').value, audio: $('#audio').value, deviceProfile})); }
function setCoreOption(key, value) { try { window.EJS_emulator?.setCoreOption?.(key, value); return true; } catch { return false; } }
function diagnostics() {
  const canvas = $('#ps1-emulator canvas');
  const rows = {...capabilities, deviceProfile, emulatorThreads: false, renderedFps: renderedFps.toFixed(1), emulatedFps: 'API do core indisponível', targetFps: '50/60 (região não exposta)', frameTime: renderedFps ? `${(1000/renderedFps).toFixed(1)} ms` : '—', droppedFrames: dropped, internalResolution: 'nativa (enhanced resolution OFF)', canvasBuffer: canvas ? `${canvas.width}×${canvas.height}` : '—', canvasVisual: canvas ? `${Math.round(canvas.clientWidth)}×${Math.round(canvas.clientHeight)}` : '—', dynarec: 'solicitado; confirmação não exposta pela build web', gpuThreadRendering: 'OFF (não confirmado na build)', audioUnderruns: 'API não exposta'};
  $('#diagnostics').innerHTML = Object.entries(rows).map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}
function measure(now) { if (!sampleStart) sampleStart = now; if (lastFrame && now-lastFrame > 34) dropped += Math.max(0, Math.round((now-lastFrame)/16.67)-1); lastFrame=now; frames++; if(now-sampleStart>=3000){renderedFps=frames*1000/(now-sampleStart); frames=0; sampleStart=now; diagnostics(); autoTune();} raf=requestAnimationFrame(measure); }
function autoTune(){ if($('#frameskip').value!=='auto'||!window.EJS_emulator)return; const next=renderedFps>=50?'0':renderedFps>=40?'1':renderedFps>=30?'2':'3'; setCoreOption('pcsx_rearmed_frameskip',next); }
const formatBytes = value => value >= 1e9 ? `${(value/1e9).toFixed(2)} GB` : value >= 1e6 ? `${(value/1e6).toFixed(1)} MB` : value >= 1e3 ? `${(value/1e3).toFixed(1)} KB` : `${value} B`;
function renderLoadState(){
  renderTimer=0; const state=ps1LoadState, known=state.totalBytes>0;
  const labels={preparing:'Preparando emulador',downloading:'Baixando arquivos',initializing:'Arquivos carregados — 100%',starting:'Iniciando jogo',running:'Jogo iniciado',error:'Falha no carregamento'};
  $('#loading-phase').textContent=labels[state.phase]; $('#loading-percent').textContent=known?`${state.percent}%`:'—';
  $('#progress-bar').style.width=known?`${state.percent}%`:'0%'; $('#progress-track').setAttribute('aria-valuenow',known?state.percent:0);
  $('#loading-details').hidden=state.phase!=='downloading';
  $('#loading-bytes').textContent=known?`${formatBytes(state.loadedBytes)} / ${formatBytes(state.totalBytes)}`:`${formatBytes(state.loadedBytes)} carregados — total não informado`;
  $('#loading-speed').textContent=state.speedBps>0?`${formatBytes(state.speedBps)}/s`:'';
  $('#loading-eta').textContent=state.etaSeconds!=null?`~${state.etaSeconds<60?Math.ceil(state.etaSeconds)+' s':Math.ceil(state.etaSeconds/60)+' min'} restantes`:'';
  $('#initializing').hidden=!['initializing','starting'].includes(state.phase); $('#initializing-text').textContent=state.phase==='starting'?'Montando conteúdo e iniciando jogo…':'Inicializando PCSX-ReARMed…';
}
function updateLoad(patch, immediate=false){Object.assign(ps1LoadState,patch);if(immediate){clearTimeout(renderTimer);renderLoadState();}else if(!renderTimer)renderTimer=setTimeout(renderLoadState,150);}
function fail(error, token=runToken){if(token!==runToken||error?.name==='AbortError')return;updateLoad({phase:'error',error},true);$('#loading').hidden=true;$('#error').hidden=false;$('#error p').textContent=error.message||String(error);}
function debug(label, value) { if (debugEnabled) console.debug(`[PS1-PLAYER] ${label}`, value); }
async function start(){
  const token=++runToken; loadController?.abort(); loadController=new AbortController();
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  Object.assign(ps1LoadState,{phase:'preparing',loadedBytes:0,totalBytes:0,percent:0,speedBps:0,etaSeconds:null,currentFile:null,error:null});
  $('#error').hidden=true; $('#loading').hidden=false; $('#cancel').hidden=false; renderLoadState();
  try {
    debug('requested game id', gameId || '(missing)');
    const resolved=await fetchPs1Game(gameId,{fetchImpl:(url,init={})=>fetch(url,{...init,signal:loadController.signal})}); game=resolved.game;
    debug('library loaded', `${resolved.count} game(s)`);
    debug('matched game', {id: game.id, name: game.name, format: game.format});
    debug('bootKey', game.bootKey || game.key);
    $('#game-name').textContent=game.name; $('#loading-game').textContent=game.name; document.title=`${game.name} — PlumpGames`; const launch=resolvePs1Launch(game);
    const began=performance.now(); let prepared=await downloadPs1Content(game,{signal:loadController.signal,onMetadata:({totalBytes})=>updateLoad({phase:'downloading',totalBytes:totalBytes||0},true),onProgress:({loadedBytes,totalBytes,currentFile})=>{
      const elapsed=(performance.now()-began)/1000, speedBps=elapsed>.25?loadedBytes/elapsed:0, percent=totalBytes?Math.min(100,Math.floor(loadedBytes/totalBytes*100)):0;
      updateLoad({phase:'downloading',loadedBytes,totalBytes:totalBytes||0,percent,speedBps,etaSeconds:totalBytes&&speedBps?(totalBytes-loadedBytes)/speedBps:null,currentFile});
    }});
    if(token!==runToken)return; objectUrl=prepared.gameUrl; const gameUrl=objectUrl;
    updateLoad({phase:'initializing',loadedBytes:prepared.totalBytes,totalBytes:prepared.totalBytes,percent:100,etaSeconds:0},true);
    Object.assign(window,{EJS_player:'#ps1-emulator',EJS_core:'psx',EJS_gameUrl:gameUrl,EJS_pathtodata:DATA,EJS_startOnLoaded:true,EJS_gameName:launch.dependencies.length?`${game.name}.zip`:game.name,EJS_threads:false,EJS_gameOptions:coreOptions()});
    window.EJS_onGameStart=()=>{if(token!==runToken)return;updateLoad({phase:'running'},true);$('#loading').hidden=true;requestAnimationFrame(measure);setTimeout(autoTune,10000);};
    window.EJS_onLoadState=()=>{if(token===runToken)updateLoad({phase:'starting'},true);};
    const loader=document.createElement('script');loader.src=`${DATA}loader.js`;loader.onerror=()=>fail(new Error('Falha ao carregar o EmulatorJS estável.'));document.head.append(loader);
  } catch(error){fail(error);}
}
function leavePlayer(){loadController?.abort();++runToken;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}if(window.opener&&!window.opener.closed){window.opener.focus();window.close();setTimeout(()=>{location.href='/?view=ps1';},250);}else location.href='/?view=ps1';}
async function fullscreen(){try{await $('#player-shell').requestFullscreen();await screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}}
$('#settings-toggle').onclick=()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',open);};
$('#diagnostics-toggle').onclick=()=>{$('#diagnostics').hidden=!$('#diagnostics').hidden;diagnostics();}; $('#diagnostics').hidden=!debugEnabled;
$('#fullscreen').onclick=fullscreen; $('#fullscreen-prompt').onclick=fullscreen; $('#retry').onclick=start; $('#restart').onclick=()=>location.reload(); $('#cancel').onclick=leavePlayer;
$('#back').onclick=event=>{event.preventDefault();leavePlayer();};
for(const id of ['profile','frameskip','audio']) $(`#${id}`).onchange=()=>{persist(); if(id!=='audio')for(const [key,value]of Object.entries(coreOptions()))setCoreOption(key,value);};
document.addEventListener('visibilitychange',()=>{try{if(document.hidden)window.EJS_emulator?.pause?.();else window.EJS_emulator?.play?.();}catch{}});
addEventListener('pagehide',()=>{loadController?.abort();++runToken;cancelAnimationFrame(raf);try{window.EJS_emulator?.gameManager?.saveState?.();window.EJS_emulator?.stop?.();}catch{}if(objectUrl)URL.revokeObjectURL(objectUrl);});
start();
