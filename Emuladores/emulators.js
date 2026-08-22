import {EMULATORS} from './emulator-registry.js';
const grid=document.querySelector('[data-emulator-list]');
if(grid) grid.replaceChildren(...EMULATORS.map(system=>{
  const card=document.createElement('article'); card.className='emulator-card';
  card.innerHTML=`<span class="emulator-badge">${system.id.toUpperCase()}</span><span class="emulator-status">${system.status}</span><h2>${system.name}</h2><p>${system.platform} · carregamento sob demanda.</p><a class="button button--primary" href="/Emuladores/${system.folder}/">Abrir emulador</a>`;
  return card;
}));
