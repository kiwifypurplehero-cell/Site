/** Metadados declarativos. Este módulo nunca importa cores ou runtimes. */
export const EMULATORS = Object.freeze([
  Object.freeze({id:'ps1',name:'PlayStation 1',folder:'PS1',platform:'PlayStation',status:'experimental',playerPath:'/Emuladores/PS1/player',romExtensions:Object.freeze(['iso','bin','cue','chd','img','mdf','pbp','ccd','m3u']),coreExtensions:Object.freeze(['iso','bin','cue','chd','img','mdf','pbp','ccd','m3u']),core:Object.freeze({status:'experimental',id:'psx',engine:'pcsx_rearmed'}),storage:Object.freeze({prefix:'Jogos/'})}),
  Object.freeze({id:'gbc',name:'Game Boy Color',folder:'GBC',platform:'Game Boy',status:'stable',playerPath:'/Emuladores/GBC/player',romExtensions:Object.freeze(['gbc','gb']),coreExtensions:Object.freeze(['gbc','gb']),core:Object.freeze({status:'stable',id:'gb',engine:'gambatte'}),storage:Object.freeze({prefix:'Jogos-GBC/'})}),
  Object.freeze({id:'gba',name:'Game Boy Advance',folder:'GBA',platform:'Game Boy',status:'experimental',playerPath:'/Emuladores/GBA/player',romExtensions:Object.freeze(['gba']),coreExtensions:Object.freeze(['gba']),core:Object.freeze({status:'experimental',id:'gba',engine:'mGBA'}),storage:Object.freeze({prefix:'Jogos-GBA/'})})
]);
export const findEmulator=id=>EMULATORS.find(item=>item.id===String(id||'').toLowerCase());
