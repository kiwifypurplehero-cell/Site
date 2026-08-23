'use strict';

/* Preferências técnicas locais: nomes de diagnósticos nunca são persistidos. */
const accessibilityStorage=window.PlumpStorage||localStorage;
const ACCESSIBILITY_STORAGE_KEY = 'plumpgamesAccessibility';
const A11Y_VERSION = 1;
const ACCESSIBILITY_PRESETS = Object.freeze({
  lowVision:{textScale:1.25,interfaceScale:1.1,largeButtons:true,largeIcons:true,strongBorders:true,highContrast:true,reduceTransparency:true,focusWidth:4,wideSpacing:true},
  colorVision:{colorPreset:'standard',symbols:true},
  dyslexia:{readableFont:true,letterSpacing:.035,wordSpacing:.12,lineHeight:1.85,textWidth:68,leftAlign:true,noJustify:true,readingHighlight:false,avoidItalic:true,shortBlocks:true},
  reducedMotion:{reduceMotion:true,pauseWallpaper:true,staticBackground:true,noPulse:true,reduceParallax:true,reduceParticles:true,noZoom:true},
  motor:{largeTargets:true,buttonSpacing:true,controlScale:1.15,focusHighlight:true,keyboardNavigation:true},
  simpleReading:{hideDecorations:true,lessInformation:true,simpleText:true,wideSpacing:true,primaryActions:true,hideStats:true,compactMenus:true,reduceMotion:true},
  lightSensitive:{luminousIntensity:55,darkTheme:true,reducePureWhite:true,reduceNeon:true,reduceGlow:true,reduceFlashes:true,softContrast:false,pauseBrightWallpaper:true},
  focus:{hideWallpaper:true,reduceColors:true,reduceMotion:true,hideNews:true,hideDecorations:true,oneGamePerRow:true,reduceNotifications:true,minimizeAssistant:true,essentialNavigation:true},
  hearing:{autoCaptions:true,visualSound:true,muteDefault:true,showAudioState:true,transcripts:true},
  custom:{}
});

const PROFILE_DEFINITIONS = [
  ['lowVision','👁','Baixa visão','Texto, contraste e elementos ampliados.','Ativar modo baixa visão',[
    ['select','textScale','Tamanho do texto',[['1','Normal'],['1.125','Grande'],['1.25','Muito grande'],['1.4','Extra grande']]],['select','interfaceScale','Escala geral',[['1','100%'],['1.1','110%'],['1.25','125%'],['1.4','140%']]],
    ...['largeButtons|Botões maiores','largeIcons|Ícones maiores','strongBorders|Bordas mais fortes','highContrast|Contraste elevado','reduceTransparency|Reduzir transparência','wideSpacing|Ampliar espaçamento'].map(x=>['check',...x.split('|')]),['range','focusWidth','Espessura do foco',2,6,.5]
  ]],
  ['colorVision','◉','Daltonismo','Paletas distinguíveis e símbolos de status.','Ativar perfil de cores',[
    ['select','colorPreset','Preset',[['standard','Padrão'],['protanopia','Protanopia'],['protanomaly','Protanomalia'],['deuteranopia','Deuteranopia'],['deuteranomaly','Deuteranomalia'],['tritanopia','Tritanopia'],['tritanomaly','Tritanomalia'],['monochrome','Monocromático'],['highContrast','Alto contraste']]],['check','symbols','Usar símbolos junto com cores']
  ]],
  ['dyslexia','Aa','Dislexia','Ritmo, largura e espaçamento de leitura.','Modo leitura para dislexia',[
    ...['readableFont|Fonte simples e legível','leftAlign|Alinhar à esquerda','noJustify|Remover texto justificado','readingHighlight|Destacar parágrafo em leitura','avoidItalic|Evitar itálico excessivo','shortBlocks|Evitar blocos longos'].map(x=>['check',...x.split('|')]),['range','letterSpacing','Espaço entre letras',0,.1,.005],['range','wordSpacing','Espaço entre palavras',0,.3,.01],['range','lineHeight','Altura de linha',1.4,2.1,.05],['range','textWidth','Largura máxima do texto',48,90,1]
  ]],
  ['reducedMotion','⏸','Sensibilidade a movimento','Reduz movimentos, transições e fundos animados.','Ativar movimento reduzido',[
    ...['reduceMotion|Reduzir animações','disableAnimations|Desligar animações','disableTransitions|Desligar transições','pauseWallpaper|Pausar live wallpaper','staticBackground|Usar fundo estático','noPulse|Remover pulsação do PJ Assistant','reduceParallax|Reduzir parallax','reduceParticles|Reduzir partículas','noZoom|Desativar zoom'].map(x=>['check',...x.split('|')])
  ]],
  ['motor','⌨','Dificuldade motora','Alvos maiores e navegação clara por teclado.','Modo controles ampliados',[
    ...['largeTargets|Alvos grandes (mínimo 44 × 44 px)','buttonSpacing|Mais espaço entre botões','focusHighlight|Destacar elemento focado','keyboardNavigation|Melhorar navegação por teclado'].map(x=>['check',...x.split('|')]),['range','controlScale','Tamanho dos controles',1,1.4,.05]
  ]],
  ['simpleReading','▤','Leitura simplificada','Menos informação e ações principais em destaque.','Modo leitura simples',[
    ...['hideDecorations|Esconder elementos decorativos','lessInformation|Reduzir informações visíveis','simpleText|Simplificar textos','wideSpacing|Aumentar espaçamento','primaryActions|Destacar Jogar / Baixar','hideStats|Ocultar estatísticas secundárias','compactMenus|Menus compactos','reduceMotion|Reduzir animações'].map(x=>['check',...x.split('|')])
  ]],
  ['lightSensitive','☾','Sensibilidade à luz','Controla luminosidade, neon e fundos claros.','Ativar conforto luminoso',[
    ['range','luminousIntensity','Intensidade luminosa (%)',0,100,1],...['darkTheme|Tema escuro','reducePureWhite|Reduzir branco puro','reduceNeon|Diminuir neon','reduceGlow|Reduzir glow','reduceFlashes|Reduzir flashes','softContrast|Reduzir contraste extremo','pauseBrightWallpaper|Pausar wallpapers muito claros'].map(x=>['check',...x.split('|')])
  ]],
  ['focus','◎','Modo foco','Interface essencial com menos estímulos.','Ativar modo foco',[
    ...['hideWallpaper|Esconder live wallpaper','reduceColors|Reduzir cores','reduceMotion|Desativar animações','hideNews|Esconder novidades','hideDecorations|Esconder decoração','oneGamePerRow|Um jogo por linha','reduceNotifications|Reduzir notificações','minimizeAssistant|Minimizar PJ Assistant','essentialNavigation|Manter navegação essencial'].map(x=>['check',...x.split('|')])
  ]],
  ['hearing','CC','Acessibilidade auditiva','Sinais visuais e suporte a conteúdo com áudio.','Ativar preferências de áudio',[
    ...['autoCaptions|Legendas automáticas quando compatíveis','visualSound|Indicação visual de eventos sonoros','muteDefault|Silenciar áudio por padrão','showAudioState|Mostrar estado do áudio','transcripts|Transcrições quando disponíveis'].map(x=>['check',...x.split('|')])
  ],'Essas opções serão usadas em jogos e conteúdos com áudio compatível.'],
  ['custom','⚙','Personalizado','Combine Texto, Cores, Movimento, Interface, Foco, Transparência, Contraste e Controles.','Criar meu perfil',[
    ['select','textScale','Texto',[['1','Normal'],['1.125','Grande'],['1.25','Muito grande'],['1.4','Extra grande']]],['select','colorPreset','Cores',[['standard','Padrão'],['monochrome','Monocromático'],['highContrast','Alto contraste']]],['check','reduceMotion','Movimento reduzido'],['check','hideDecorations','Interface sem decoração'],['check','hideNews','Foco sem novidades'],['check','reduceTransparency','Reduzir transparência'],['check','highContrast','Contraste elevado'],['check','largeTargets','Controles maiores']
  ]]
];

const COLOR_PRESETS = {
  standard:null, protanopia:['#2563eb','#f59e0b','#fef3c7','#0072b2','#e69f00','#cc79a7'], protanomaly:['#3769b1','#d49b45','#f3dfb2','#2678a5','#ce9838','#b46b91'],
  deuteranopia:['#0072b2','#e69f00','#f0e442','#56b4e9','#f5a623','#cc79a7'], deuteranomaly:['#2076a1','#d69429','#e7d750','#58a8d2','#eb9d30','#bf749b'],
  tritanopia:['#d55e00','#009e73','#f0e442','#009e73','#e69f00','#cc79a7'], tritanomaly:['#c96720','#178d70','#e6dc51','#198d75','#dd9930','#c5799b'],
  monochrome:['#d8d8d8','#8d8d8d','#ffffff','#bdbdbd','#e2e2e2','#737373'], highContrast:['#00ffff','#ffff00','#ffffff','#00ff9d','#ffd400','#ff5c8a']
};
let accessibilityState={version:A11Y_VERSION,active:[],manual:{}}, undoState=null, wallpaperPlaybackBeforeA11y=null;
try { const stored=JSON.parse(accessibilityStorage.getItem(ACCESSIBILITY_STORAGE_KEY)||'null'); if(stored?.version===A11Y_VERSION) accessibilityState={...accessibilityState,...stored}; } catch { accessibilityStorage.removeItem(ACCESSIBILITY_STORAGE_KEY); }
const profileMap=Object.fromEntries(PROFILE_DEFINITIONS.map(profile=>[profile[0],profile]));

function controlMarkup(profileId, control) {
  const [type,key,label,...args]=control, id=`a11y-${profileId}-${key}`;
  if(type==='check') return `<label class="a11y-check"><input id="${id}" type="checkbox" data-a11y-control="${key}" data-profile="${profileId}"> <span>${label}</span></label>`;
  if(type==='select') return `<label for="${id}">${label}<select id="${id}" data-a11y-control="${key}" data-profile="${profileId}">${args[0].map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
  return `<label for="${id}">${label} <output for="${id}"></output><input id="${id}" type="range" min="${args[0]}" max="${args[1]}" step="${args[2]}" data-a11y-control="${key}" data-profile="${profileId}"></label>`;
}
function renderAccessibilityPanel() {
  document.querySelector('#a11y-quick-actions').innerHTML=[['textScale','Texto maior','1.25'],['highContrast','Alto contraste','true'],['reduceMotion','Sem animações','true'],['largeTargets','Controles maiores','true'],['focus','Modo foco','profile']].map(x=>`<button type="button" data-a11y-quick="${x[0]}" data-value="${x[2]}">${x[1]}</button>`).join('');
  document.querySelector('#accessibility-profiles').innerHTML=PROFILE_DEFINITIONS.map(([id,icon,name,description,activate,controls,note])=>`<article class="a11y-profile" data-profile-card="${id}"><header><button class="a11y-profile__expand" type="button" aria-expanded="false" aria-controls="a11y-panel-${id}"><span class="a11y-profile__icon" aria-hidden="true">${icon}</span><span><strong>${name}</strong><small>${description}</small></span><span class="a11y-profile__state">Desligado</span><span aria-hidden="true">›</span></button></header><div class="a11y-profile__panel" id="a11y-panel-${id}" hidden><fieldset><legend>Configurações de ${name}</legend>${controls.map(c=>controlMarkup(id,c)).join('')}</fieldset>${note?`<p class="a11y-note">${note}</p>`:''}<button class="button button--primary" type="button" data-a11y-toggle="${id}">${activate}</button></div></article>`).join('');
  bindAccessibilityPanel(); syncAccessibilityControls(); applyAccessibility();
}
function mergedSettings() {
  return accessibilityState.active.reduce((all,id)=>{ const next={...ACCESSIBILITY_PRESETS[id],...(accessibilityState.manual[id]||{})}; const merged={...all,...next}; ['textScale','interfaceScale','controlScale','lineHeight','focusWidth'].forEach(key=>{ if(all[key]!==undefined&&next[key]!==undefined) merged[key]=Math.max(Number(all[key]),Number(next[key])); }); return merged; },{});
}
function rememberUndo(){ undoState=structuredClone(accessibilityState); document.querySelector('#a11y-undo').disabled=false; }
function persistAccessibility(){ accessibilityStorage.setItem(ACCESSIBILITY_STORAGE_KEY,JSON.stringify(accessibilityState)); }
function updateSetting(profile,key,value){ rememberUndo(); accessibilityState.manual[profile]={...(accessibilityState.manual[profile]||{}),[key]:value}; if(!accessibilityState.active.includes(profile)) accessibilityState.active.push(profile); persistAccessibility(); applyAccessibility(); syncAccessibilityControls(); }
function toggleProfile(id){ rememberUndo(); const index=accessibilityState.active.indexOf(id); if(index<0) accessibilityState.active.push(id); else accessibilityState.active.splice(index,1); persistAccessibility(); applyAccessibility(); syncAccessibilityControls(); }

function applyAccessibility(){
  const settings=mergedSettings(), root=document.documentElement, body=document.body;
  const classes={lowVision:'a11y-low-vision',highContrast:'a11y-high-contrast',dyslexia:'a11y-dyslexia',reducedMotion:'a11y-reduced-motion',motor:'a11y-motor',simpleReading:'a11y-simple-reading',lightSensitive:'a11y-light-sensitive',focus:'a11y-focus'};
  Object.entries(classes).forEach(([id,c])=>root.classList.toggle(c,accessibilityState.active.includes(id)||(id==='highContrast'&&settings.highContrast)));
  root.style.setProperty('--accessibility-text-scale',settings.textScale||1); root.style.setProperty('--accessibility-line-height',settings.lineHeight||1.6); root.style.setProperty('--accessibility-letter-spacing',`${settings.letterSpacing||0}em`); root.style.setProperty('--accessibility-control-scale',settings.controlScale||1); root.style.setProperty('--accessibility-contrast',settings.highContrast?1.25:1); root.style.setProperty('--accessibility-surface-opacity',settings.reduceTransparency?1:.86); root.style.setProperty('--accessibility-focus-width',`${settings.focusWidth||3}px`); root.style.setProperty('--accessibility-animation-scale',settings.reduceMotion?0:1); root.style.setProperty('--accessibility-glow-scale',(settings.luminousIntensity??100)/100);
  root.style.setProperty('--accessibility-text-width',`${settings.textWidth||90}ch`); root.style.setProperty('--wallpaper-brightness',(settings.luminousIntensity??100)/100); root.style.setProperty('--surface-brightness',Math.max(.45,(settings.luminousIntensity??100)/100));
  ['largeButtons','largeIcons','strongBorders','reduceTransparency','wideSpacing','largeTargets','buttonSpacing','focusHighlight','hideDecorations','lessInformation','primaryActions','hideStats','compactMenus','reducePureWhite','reduceNeon','reduceGlow','softContrast','reduceColors','hideNews','oneGamePerRow','reduceNotifications','essentialNavigation','symbols'].forEach(key=>root.classList.toggle(`a11y-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}`,Boolean(settings[key])));
  const palette=COLOR_PRESETS[settings.colorPreset]; if(palette){ ['primary','secondary','accent','success','warning','error'].forEach((key,i)=>root.style.setProperty(`--color-${key}`,palette[i])); } else ['success','warning','error'].forEach(key=>root.style.removeProperty(`--color-${key}`));
  const pause=settings.reduceMotion||settings.pauseWallpaper||settings.staticBackground||settings.hideWallpaper||settings.pauseBrightWallpaper;
  const video=document.querySelector('.live-wallpaper-video.is-visible'); if(video){ if(pause){if(wallpaperPlaybackBeforeA11y===null) wallpaperPlaybackBeforeA11y=!video.paused; window.pauseWallpaper?.(false);} else if(wallpaperPlaybackBeforeA11y){window.resumeWallpaper?.();wallpaperPlaybackBeforeA11y=null;} video.style.visibility=settings.hideWallpaper?'hidden':''; }
  if(settings.minimizeAssistant && !document.querySelector('#plump-assistant-panel')?.hidden) document.querySelector('#assistant-minimize')?.click();
  document.querySelector('#accessibility-menu-status').textContent=accessibilityState.active.length?`● Ativa (${accessibilityState.active.length})`:'Inativa';
  const overlapping=accessibilityState.active.filter(id=>ACCESSIBILITY_PRESETS[id]?.textScale).length>1; document.querySelector('#a11y-conflict').textContent=overlapping?'Dois perfis alteram o texto. Será usado o maior valor configurado.':'';
}
function syncAccessibilityControls(){
  PROFILE_DEFINITIONS.forEach(([id])=>{ const active=accessibilityState.active.includes(id), card=document.querySelector(`[data-profile-card="${id}"]`); card.classList.toggle('is-active',active); card.querySelector('.a11y-profile__state').textContent=active?'✓ Ligado':'Desligado'; card.querySelector('[data-a11y-toggle]').textContent=active?'Desativar perfil':profileMap[id][4]; });
  document.querySelectorAll('[data-a11y-control]').forEach(input=>{ const value=(accessibilityState.manual[input.dataset.profile]||{})[input.dataset.a11yControl] ?? ACCESSIBILITY_PRESETS[input.dataset.profile]?.[input.dataset.a11yControl]; if(input.type==='checkbox') input.checked=Boolean(value); else if(value!==undefined) input.value=value; const output=input.parentElement.querySelector('output'); if(output) output.value=input.dataset.a11yControl==='luminousIntensity'?`${input.value}%`:input.value; });
}
function bindAccessibilityPanel(){
  document.querySelectorAll('.a11y-profile__expand').forEach(button=>button.addEventListener('click',()=>{ const opening=button.getAttribute('aria-expanded')!=='true'; document.querySelectorAll('.a11y-profile__expand').forEach(other=>{other.setAttribute('aria-expanded','false');document.getElementById(other.getAttribute('aria-controls')).hidden=true;}); button.setAttribute('aria-expanded',String(opening)); document.getElementById(button.getAttribute('aria-controls')).hidden=!opening; }));
  document.querySelectorAll('[data-a11y-toggle]').forEach(button=>button.addEventListener('click',()=>toggleProfile(button.dataset.a11yToggle)));
  document.querySelectorAll('[data-a11y-control]').forEach(input=>input.addEventListener(input.type==='range'?'input':'change',()=>{let value=input.type==='checkbox'?input.checked:input.value;if(input.type==='range'||(input.tagName==='SELECT'&&!Number.isNaN(Number(value)))) value=Number(value);updateSetting(input.dataset.profile,input.dataset.a11yControl,value);}));
  document.querySelectorAll('[data-a11y-quick]').forEach(button=>button.addEventListener('click',()=>button.dataset.value==='profile'?toggleProfile('focus'):updateSetting('custom',button.dataset.a11yQuick,button.dataset.value==='true'?true:Number(button.dataset.value))));
  document.querySelector('#a11y-undo').addEventListener('click',()=>{if(!undoState)return;accessibilityState=undoState;undoState=null;persistAccessibility();applyAccessibility();syncAccessibilityControls();document.querySelector('#a11y-undo').disabled=true;});
  document.querySelector('#a11y-reset').addEventListener('click',()=>{if(confirm('Restaurar configurações de acessibilidade?')){rememberUndo();accessibilityState={version:A11Y_VERSION,active:[],manual:{}};persistAccessibility();applyAccessibility();syncAccessibilityControls();}});
  document.querySelector('[data-a11y-suggest]')?.addEventListener('click',()=>{toggleProfile('reducedMotion');document.querySelector('#reduced-motion-suggestion').hidden=true;});
}
renderAccessibilityPanel();
if(matchMedia('(prefers-reduced-motion: reduce)').matches&&!accessibilityState.active.includes('reducedMotion')) document.querySelector('#reduced-motion-suggestion').hidden=false;
/* Reaplica a paleta acessível depois de mudanças do tema comum, sem substituir o tema salvo. */
document.querySelector('#appearance-content')?.addEventListener('change',()=>queueMicrotask(applyAccessibility));
document.querySelector('#apply-theme')?.addEventListener('click',()=>queueMicrotask(applyAccessibility));
