const QUEUE_KEY='plumpgames_playtime_queue';
const HEARTBEAT_MS=45_000;
const LOCK_TTL=12_000;
const MAX_QUEUE=100;
const uuid=()=>crypto.randomUUID();
const validDescriptor=g=>g&&/^[a-z0-9][a-z0-9:._-]{2,159}$/i.test(g.gameId)&&g.title&&g.system&&g.source;

function queueRead(){try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(q)?q:[];}catch{return[];}}
function queueWrite(q){try{localStorage.setItem(QUEUE_KEY,JSON.stringify(q.slice(-MAX_QUEUE)));}catch{}}
async function send(path,payload,{beacon=false}={}){
  const body=JSON.stringify(payload);
  if(beacon&&navigator.sendBeacon?.(path,new Blob([body],{type:'application/json'})))return true;
  const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body,keepalive:beacon});
  if(!response.ok)throw new Error(`playtime ${response.status}`);return true;
}

export class PlaytimeTracker extends EventTarget {
  constructor(game,{heartbeatMs=HEARTBEAT_MS,now=()=>performance.now()}={}){
    super();if(!validDescriptor(game))throw new TypeError('Invalid game descriptor');
    this.game={gameId:game.gameId,title:String(game.title).slice(0,120),system:String(game.system).slice(0,40),source:String(game.source).slice(0,20),sourceKey:String(game.sourceKey||game.gameId).slice(0,160),cover:String(game.cover||'').slice(0,500)};
    this.sessionId=uuid();this.heartbeatMs=heartbeatMs;this.now=now;this.sequence=0;this.pending=0;this.totalLocal=0;this.running=false;this.focused=document.hasFocus();this.lastTick=0;this.tabId=uuid();this.lockKey=`plumpgames_lock:${game.gameId}`;
    this.channel=typeof BroadcastChannel==='function'?new BroadcastChannel('plumpgames-playtime'):null;this.channel?.addEventListener('message',()=>this.refreshLock());
    this.onVisibility=()=>{this.focused=!document.hidden&&document.hasFocus();this.focused?this.resumeClock():this.pauseClock();};
    this.onOnline=async()=>{try{await this.ensureSession();}catch{}this.syncQueue();};document.addEventListener('visibilitychange',this.onVisibility);addEventListener('focus',this.onVisibility);addEventListener('blur',this.onVisibility);addEventListener('online',this.onOnline);addEventListener('pagehide',()=>this.end({beacon:true}),{once:true});
  }
  async start(){this.syncQueue();return this;}
  ensureSession(){if(!this.startPromise)this.startPromise=send('/api/player/session/start',{sessionId:this.sessionId,game:this.game}).catch(()=>{this.startPromise=null;throw new Error('session start failed');});return this.startPromise;}
  markRunning(){if(this.running)return;this.running=true;this.everStarted=true;this.ensureSession().catch(()=>{});this.refreshLock();this.resumeClock();this.timer=setInterval(()=>this.flush(),this.heartbeatMs);this.lockTimer=setInterval(()=>this.refreshLock(),LOCK_TTL/2);}
  markPaused(){this.running=false;this.pauseClock();clearInterval(this.timer);clearInterval(this.lockTimer);this.flush();}
  ownsLock(){try{const lock=JSON.parse(localStorage.getItem(this.lockKey)||'null');return !lock||lock.expires<Date.now()||lock.tabId===this.tabId;}catch{return true;}}
  refreshLock(){if(!this.running)return;try{if(this.ownsLock()){localStorage.setItem(this.lockKey,JSON.stringify({tabId:this.tabId,expires:Date.now()+LOCK_TTL}));this.channel?.postMessage({gameId:this.game.gameId});this.resumeClock();}else this.pauseClock();}catch{this.resumeClock();}}
  resumeClock(){if(this.running&&this.focused&&this.ownsLock()&&!this.lastTick)this.lastTick=this.now();}
  pauseClock(){this.collect();this.lastTick=0;}
  collect(){if(!this.lastTick)return;const now=this.now(),delta=Math.max(0,Math.min(60,(now-this.lastTick)/1000));this.lastTick=now;this.pending+=delta;this.totalLocal+=delta;this.dispatchEvent(new CustomEvent('tick',{detail:{seconds:this.totalLocal}}));}
  async flush({beacon=false}={}){this.collect();const seconds=Math.floor(this.pending);if(seconds<1)return;this.pending-=seconds;const item={path:'/api/player/session/heartbeat',payload:{sessionId:this.sessionId,sequence:++this.sequence,activeSeconds:seconds}};try{await this.ensureSession();await send(item.path,item.payload,{beacon});}catch{const q=queueRead();q.push(item);queueWrite(q);}}
  async syncQueue(){const q=queueRead();if(!q.length)return;const remaining=[];for(const item of q){try{await send(item.path,item.payload);}catch{remaining.push(item);}}queueWrite(remaining);}
  async end({beacon=false}={}){this.running=false;this.pauseClock();clearInterval(this.timer);clearInterval(this.lockTimer);if(this.everStarted){const seconds=Math.floor(this.pending);this.pending-=seconds;const item={path:'/api/player/session/end',payload:{sessionId:this.sessionId,sequence:++this.sequence,activeSeconds:seconds}};try{await this.ensureSession();await send(item.path,item.payload,{beacon});}catch{const q=queueRead();q.push(item);queueWrite(q);}}try{const lock=JSON.parse(localStorage.getItem(this.lockKey)||'null');if(lock?.tabId===this.tabId)localStorage.removeItem(this.lockKey);}catch{}this.channel?.close();}
}

export function descriptor({source='emulator',system,id,title,cover=''}){const key=String(id||'').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,'');return {gameId:`${source}:${system}:${key}`,source,system,title,sourceKey:key,cover};}
export function bindEmulatorControls(emulator,tracker){if(!emulator||emulator.__plumpgamesPlaytime)return;for(const [method,action] of [['pause','markPaused'],['stop','markPaused'],['play','markRunning']]){if(typeof emulator[method]!=='function')continue;const original=emulator[method].bind(emulator);emulator[method]=(...args)=>{const result=original(...args);tracker[action]();return result;};}emulator.__plumpgamesPlaytime=true;}
