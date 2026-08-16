import {downloadPs1Archive, fetchPs1Game, inspectPs1File, resolvePs1Launch} from './ps1-utils.js';

const DATA = 'https://cdn.emulatorjs.org/stable/data/';
const query = new URLSearchParams(location.search);
const gameId = query.get('game') || '';
const debugEnabled = query.has('debug');
const $ = selector => document.querySelector(selector);
let game, objectUrl, raf, sampleStart, frames = 0, dropped = 0, lastFrame, renderedFps = 0;
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
function fail(error){$('#loading').hidden=true;$('#error').hidden=false;$('#error p').textContent=error.message||String(error);}
function debug(label, value) { if (debugEnabled) console.debug(`[PS1-PLAYER] ${label}`, value); }
async function start(){
  $('#error').hidden=true; $('#loading').hidden=false;
  try {
    debug('requested game id', gameId || '(missing)');
    const resolved=await fetchPs1Game(gameId); game=resolved.game;
    debug('library loaded', `${resolved.count} game(s)`);
    debug('matched game', {id: game.id, name: game.name, format: game.format});
    debug('bootKey', game.bootKey || game.key);
    $('#game-name').textContent=game.name; document.title=`${game.name} — PlumpGames`; const launch=resolvePs1Launch(game); let gameUrl=launch.bootUrl;
    const inspection=await inspectPs1File(gameUrl); if(inspection.ok===false)throw new Error(`Arquivo indisponível (HTTP ${inspection.details.status}).`);
    if(launch.dependencies.length){const prepared=await downloadPs1Archive(game,{onProgress:(i,total,key)=>{$('#loading b').textContent=`Baixando ${String(key).split('/').pop()} (${i+1}/${total})…`;}}); objectUrl=prepared.gameUrl;gameUrl=objectUrl;}
    Object.assign(window,{EJS_player:'#ps1-emulator',EJS_core:'psx',EJS_gameUrl:gameUrl,EJS_pathtodata:DATA,EJS_startOnLoaded:true,EJS_gameName:launch.dependencies.length?`${game.name}.zip`:game.name,EJS_threads:false,EJS_gameOptions:coreOptions()});
    window.EJS_onGameStart=()=>{$('#loading').hidden=true;requestAnimationFrame(measure);setTimeout(autoTune,10000);};
    const loader=document.createElement('script');loader.src=`${DATA}loader.js`;loader.onerror=()=>fail(new Error('Falha ao carregar o EmulatorJS estável.'));document.head.append(loader);
  } catch(error){fail(error);}
}
async function fullscreen(){try{await $('#player-shell').requestFullscreen();await screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}}
$('#settings-toggle').onclick=()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',open);};
$('#diagnostics-toggle').onclick=()=>{$('#diagnostics').hidden=!$('#diagnostics').hidden;diagnostics();}; $('#diagnostics').hidden=!debugEnabled;
$('#fullscreen').onclick=fullscreen; $('#fullscreen-prompt').onclick=fullscreen; $('#retry').onclick=start; $('#restart').onclick=()=>location.reload();
$('#back').onclick=event=>{event.preventDefault();if(window.opener&&!window.opener.closed){window.opener.focus();window.close();setTimeout(()=>{location.href='/?view=ps1';},250);}else location.href='/?view=ps1';};
for(const id of ['profile','frameskip','audio']) $(`#${id}`).onchange=()=>{persist(); if(id!=='audio')for(const [key,value]of Object.entries(coreOptions()))setCoreOption(key,value);};
document.addEventListener('visibilitychange',()=>{try{if(document.hidden)window.EJS_emulator?.pause?.();else window.EJS_emulator?.play?.();}catch{}});
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);try{window.EJS_emulator?.gameManager?.saveState?.();window.EJS_emulator?.stop?.();}catch{}if(objectUrl)URL.revokeObjectURL(objectUrl);});
start();
