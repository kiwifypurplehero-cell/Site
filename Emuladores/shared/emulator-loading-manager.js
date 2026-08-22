export const LOADING_PHASES=Object.freeze(['preparing','network','downloading','download_complete','loading_runtime','loading_core','creating_canvas','mounting_content','starting_core','waiting_first_frame','running','error']);

export const INITIALIZATION_STEPS=Object.freeze({
  runtime_available:{phase:'loading_runtime',progress:15,label:'Runtime disponível'},
  loader_loaded:{phase:'loading_runtime',progress:25,label:'Loader carregado'},
  core_requested:{phase:'loading_core',progress:35,label:'Core solicitado'},
  core_loaded:{phase:'loading_core',progress:55,label:'Core carregado'},
  canvas_created:{phase:'creating_canvas',progress:65,label:'Canvas criado'},
  input_ready:{phase:'creating_canvas',progress:72,label:'Controles inicializados'},
  content_mounted:{phase:'mounting_content',progress:82,label:'Conteúdo montado'},
  boot_requested:{phase:'starting_core',progress:92,label:'Boot solicitado'},
  waiting_first_frame:{phase:'waiting_first_frame',progress:96,label:'Aguardando primeiro frame'},
  first_frame:{phase:'running',progress:100,label:'Primeiro frame'}
});

export const LOADING_PROFILES=Object.freeze({
  gbc:Object.freeze({preparing:5,network:5,download:30,initialization:55,firstFrame:5}),
  ps1:Object.freeze({preparing:3,network:5,download:57,initialization:30,firstFrame:5}),
  default:Object.freeze({preparing:5,network:5,download:45,initialization:40,firstFrame:5})
});

const PHASE_LABELS={preparing:'Preparando...',network:'Verificando arquivo e conexão...',downloading:'Baixando arquivos...',download_complete:'Arquivos concluídos',loading_runtime:'Inicializando emulador...',loading_core:'Carregando core',creating_canvas:'Criando vídeo e controles',mounting_content:'Montando conteúdo',starting_core:'Iniciando core',waiting_first_frame:'Aguardando primeiro frame',running:'Iniciado',error:'Falha na inicialização'};
const STATUS={runtime_available:'Runtime',loader_loaded:'Loader',core_requested:'Core solicitado',core_loaded:'Core',canvas_created:'Canvas',input_ready:'Controles',content_mounted:'Conteúdo',boot_requested:'Boot',waiting_first_frame:'Primeiro frame'};

export class EmulatorLoadingManager {
  constructor({profile='default',root=document,renderInterval=150,onChange}={}){this.profile=typeof profile==='string'?(LOADING_PROFILES[profile]||LOADING_PROFILES.default):profile;this.root=root;this.renderInterval=renderInterval;this.onChange=onChange;this.reset();}
  reset(){this.clearTimeout();this.phase='preparing';this.downloadProgress=0;this.initializationProgress=0;this.totalProgress=0;this.completed=new Set();this.error=null;this.schedule(true);}
  setPhase(phase){if(!LOADING_PHASES.includes(phase))throw new Error(`Fase desconhecida: ${phase}`);this.phase=phase;this.schedule();return this;}
  setDownloadProgress(value){this.downloadProgress=Math.max(this.downloadProgress,Math.min(100,Number(value)||0));this.phase=this.downloadProgress===100?'download_complete':'downloading';this.schedule();return this;}
  setInitializationProgress(value){this.initializationProgress=Math.max(this.initializationProgress,Math.min(100,Number(value)||0));this.schedule();return this;}
  completeStep(name){const step=INITIALIZATION_STEPS[name];if(!step)throw new Error(`Etapa desconhecida: ${name}`);this.completed.add(name);this.phase=step.phase;this.setInitializationProgress(step.progress);return this;}
  markFirstFrame(){this.completeStep('first_frame');this.phase='running';this.clearTimeout();this.schedule(true);return this;}
  startTimeout(step,ms,message){this.clearTimeout();this.timeout=setTimeout(()=>this.fail(Object.assign(new Error('Não foi possível concluir a inicialização do emulador.'),{code:step,detail:message||step})),ms);return this;}
  clearTimeout(){if(this.timeout)clearTimeout(this.timeout);this.timeout=0;}
  fail(error){this.clearTimeout();this.phase='error';this.error=error;this.schedule(true);return this;}
  calculateTotal(){const w=this.profile,download=w.download*this.downloadProgress/100,init=w.initialization*Math.min(this.initializationProgress,99)/100,base=(this.phase==='preparing'?0:w.preparing)+(this.phase==='preparing'||this.phase==='network'?0:w.network);let value=base+download+init;if(this.phase==='running')value=100;else value=Math.min(99,value);this.totalProgress=Math.max(this.totalProgress,value);return Math.floor(this.totalProgress);}
  schedule(immediate=false){if(immediate){clearTimeout(this.renderTimer);this.renderTimer=0;this.render();}else if(!this.renderTimer)this.renderTimer=setTimeout(()=>{this.renderTimer=0;this.render();},this.renderInterval);}
  render(){const total=this.calculateTotal(),q=s=>this.root?.querySelector?.(s),set=(s,v)=>{const el=q(s);if(el)el.textContent=v;},bar=q('#progress-bar');if(bar)bar.style.width=`${total}%`;const track=q('#progress-track');track?.setAttribute('aria-valuenow',total);set('#loading-percent',`${total}%`);set('#loading-phase',PHASE_LABELS[this.phase]||this.phase);set('#initialization-progress',`Inicialização: ${this.initializationProgress}%`);set('#files-progress',`Arquivos: ${this.downloadProgress}%`);const details=q('#initialization-details');if(details){details.innerHTML=Object.entries(STATUS).map(([key,label])=>`<div><dt>${label}</dt><dd>${this.completed.has(key)?'concluído':this.phase==='error'&&this.error?.code===key?'falhou':'aguardando'}</dd></div>`).join('');}this.onChange?.(this.snapshot());}
  snapshot(){return {phase:this.phase,downloadProgress:this.downloadProgress,initializationProgress:this.initializationProgress,totalProgress:this.calculateTotal(),completed:[...this.completed],error:this.error};}
}

export function instrumentFirstFrame(container,callback){const disposers=[];for(const [prototype,methods] of [[globalThis.WebGLRenderingContext?.prototype,['drawArrays','drawElements']], [globalThis.WebGL2RenderingContext?.prototype,['drawArrays','drawElements']],[globalThis.CanvasRenderingContext2D?.prototype,['drawImage','putImageData','fillRect']]])for(const name of methods){if(!prototype?.[name])continue;const original=prototype[name];function wrapped(...args){const result=original.apply(this,args);if(this.canvas?.closest?.(container))queueMicrotask(callback);return result;}prototype[name]=wrapped;disposers.push(()=>{if(prototype[name]===wrapped)prototype[name]=original;});}return()=>disposers.forEach(dispose=>dispose());}

export const BOOT_TIMEOUTS=Object.freeze({runtime_loading:20_000,core_loading:20_000,canvas_creation:20_000,content_mounting:20_000,waiting_first_frame:20_000});
const BOOT_LABELS={runtime_loading:'Runtime',core_loading:'Core',canvas_creation:'Renderização',content_mounting:'Conteúdo',waiting_first_frame:'Primeiro frame'};

/** Observa o bootstrap real do EmulatorJS sem depender de EJS_onLoadState.
 * Essa opção é um callback de save-state, não um sinal de que o core/WASM abriu. */
export class EmulatorBootDiagnostics {
  constructor({system,container,loading,onError,debug=false,time=globalThis}={}){this.system=system;this.container=container;this.loading=loading;this.onError=onError;this.debug=debug;this.time=time;this.phase='preparing';this.timer=0;this.poller=0;}
  log(message,details){if(this.debug||message==='error')console.info(`[EMU-LOAD] system=${this.system} phase=${this.phase} ${message}`,details??'');}
  enter(phase,{timeout=BOOT_TIMEOUTS[phase]}={}){this.cancelTimer();this.phase=phase;this.log(phase);if(timeout)this.timer=this.time.setTimeout(()=>this.fail(Object.assign(new Error('Não foi possível inicializar o emulador.'),{code:phase,detail:`Etapa: ${BOOT_LABELS[phase]||phase}`})),timeout);return this;}
  complete(step){this.cancelTimer();this.loading?.completeStep(step);this.log(`${step} complete`);return this;}
  watchRuntime({current=()=>true,onCore,onCanvas}={}){this.stopWatching();this.enter('core_loading');this.loading?.completeStep('core_requested');let coreSeen=false,canvasSeen=false;const inspect=()=>{if(!current())return this.stopWatching();if(!coreSeen&&globalThis.EJS_emulator){coreSeen=true;this.complete('core_loaded');this.enter('canvas_creation');onCore?.();}const canvas=typeof this.container==='string'?globalThis.document?.querySelector?.(`${this.container} canvas`):this.container?.querySelector?.('canvas');if(coreSeen&&!canvasSeen&&canvas?.width&&canvas?.height){canvasSeen=true;this.complete('canvas_created');this.enter('content_mounting');onCanvas?.(canvas);}};this.poller=this.time.setInterval(inspect,50);inspect();return this;}
  mounted(){this.complete('content_mounted');this.stopWatching();return this;}
  waitingFirstFrame(){this.enter('waiting_first_frame');return this;}
  running(){this.cancelTimer();this.stopWatching();this.phase='running';this.log('first frame');}
  fail(error){this.cancelTimer();this.stopWatching();this.phase='error';this.loading?.fail(error);this.log('error',{code:error.code,message:error.message});this.onError?.(error);}
  cancelTimer(){if(this.timer)this.time.clearTimeout(this.timer);this.timer=0;}
  stopWatching(){if(this.poller)this.time.clearInterval(this.poller);this.poller=0;}
  destroy(){this.cancelTimer();this.stopWatching();}
}
