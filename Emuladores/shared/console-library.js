import {findEmulator} from '../emulator-registry.js';
import {fetchEmulatorLibrary,renderLibraryIncrementally,refreshLibraryButton} from './emulator-library.js';
const root=document.querySelector('[data-console]'), system=findEmulator(root?.dataset.console);
const status=document.querySelector('[data-library-status]'),list=document.querySelector('[data-rom-list]');
const bytes=value=>new Intl.NumberFormat('pt-BR',{style:'unit',unit:'megabyte',maximumFractionDigits:1}).format((value||0)/1048576);
function card(game){const item=document.createElement('article');item.className='rom-card';const info=document.createElement('div');const title=document.createElement('strong');title.textContent=game.name;const meta=document.createElement('small');meta.textContent=`${String(game.format||'ROM').toUpperCase()} · ${bytes(game.size)}`;info.append(title,meta);const link=document.createElement('a');link.className='button button--play';link.textContent='Jogar';link.href=`${system.playerPath}?game=${encodeURIComponent(game.id)}`;item.append(info,link);return item;}
async function load(options={}){try{const payload=await fetchEmulatorLibrary(system.id,options);await renderLibraryIncrementally(list,payload.games,card);status.textContent=payload.games.length?`${payload.games.length} jogo(s) encontrado(s).`:'Nenhum jogo publicado ainda.';}catch(error){status.textContent=error.message||'Não foi possível carregar a biblioteca.';}}
document.querySelector('[data-refresh]').addEventListener('click',event=>refreshLibraryButton(system.id,event.currentTarget,load));load();
