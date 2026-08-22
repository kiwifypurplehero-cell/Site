import {formatPlaytime} from './player-profile.js';

let played=new Map();
function decorate(){document.querySelectorAll('.game-card[data-game-id]').forEach(card=>{const game=played.get(card.dataset.gameId),body=card.querySelector('.game-card__body');if(!game||!body||body.querySelector('.played-time'))return;const label=document.createElement('small');label.className='played-time';label.textContent=`Jogado: ${formatPlaytime(game.totalSeconds)}`;body.querySelector('.card-actions')?.before(label);});}
new MutationObserver(decorate).observe(document.body,{subtree:true,childList:true});
try{const response=await fetch('/api/player/games',{credentials:'same-origin'});if(response.ok){const data=await response.json();played=new Map((data.games||[]).map(game=>[game.gameId,game]));decorate();}}catch{}
