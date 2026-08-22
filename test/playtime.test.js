import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
globalThis.document={hidden:false,hasFocus:()=>true,addEventListener(){}};
globalThis.addEventListener=()=>{};
Object.defineProperty(globalThis,'navigator',{value:{sendBeacon:()=>false},configurable:true});
globalThis.CustomEvent=class extends Event{constructor(type,init){super(type);this.detail=init?.detail;}};

const profileModule=await import('../player-profile.js');
const trackerModule=await import('../playtime-tracker.js');

test('primeiro acesso gera UUID v4 e reload preserva o perfil',()=>{
  values.clear();const first=new profileModule.PlayerProfileManager(localStorage).get();const reload=new profileModule.PlayerProfileManager(localStorage).get();
  assert.match(first.guestPlayerId,/^[0-9a-f-]{36}$/i);assert.equal(reload.guestPlayerId,first.guestPlayerId);
});

test('formata tempo e tiers relativos sem tier para histórico pequeno',()=>{
  assert.equal(profileModule.formatPlaytime(45),'45s');assert.equal(profileModule.formatPlaytime(752),'12min');assert.equal(profileModule.formatPlaytime(5520),'1h 32min');
  assert.equal(profileModule.tierFor(0,2),null);assert.deepEqual([0,1,3,5,9].map(i=>profileModule.tierFor(i,10)),['S','S','A','B','D']);
});

test('descritores são estáveis e distinguem Git, GBC, GBA e PS1',()=>{
  const {descriptor}=trackerModule;
  assert.equal(descriptor({source:'git',system:'web',id:'UNDERTALE',title:'Undertale'}).gameId,'git:web:undertale');
  for(const system of ['gbc','gba','ps1'])assert.equal(descriptor({system,id:'Pokemon Emerald',title:'Jogo'}).gameId,`emulator:${system}:pokemon-emerald`);
});

test('tracker não inicia no loading e envia somente tempo após gameplay',async()=>{
  values.clear();let now=100;const requests=[];globalThis.fetch=async(url,init)=>{requests.push([url,JSON.parse(init.body)]);return {ok:true};};
  const tracker=new trackerModule.PlaytimeTracker(trackerModule.descriptor({system:'gba',id:'emerald',title:'Emerald'}),{now:()=>now,heartbeatMs:999999});
  await tracker.start();assert.equal(requests.length,0,'loading não abre sessão');tracker.markRunning();await Promise.resolve();now+=5_400;tracker.markPaused();await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(requests[0][0],'/api/player/session/start');assert.equal(requests[1][0],'/api/player/session/heartbeat');assert.equal(requests[1][1].activeSeconds,5);await tracker.end();
});

test('integração universal, privacidade, offline e idempotência permanecem declaradas',()=>{
  for(const file of ['play.js','Emuladores/GBC/gbc-player.js','Emuladores/GBA/gba-player.js','Emuladores/PS1/ps1-player.js'])assert.match(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),/PlaytimeTracker/);
  const worker=fs.readFileSync(new URL('../worker.js',import.meta.url),'utf8'),tracker=fs.readFileSync(new URL('../playtime-tracker.js',import.meta.url),'utf8');
  assert.match(worker,/HttpOnly; Secure; SameSite=Lax/);assert.match(worker,/last_sequence/);assert.match(worker,/seconds>60/);assert.doesNotMatch(worker,/searchParams\.get\(['"]playerId/);
  assert.match(tracker,/BroadcastChannel/);assert.match(tracker,/MAX_QUEUE=100/);assert.match(tracker,/performance\.now/);assert.match(tracker,/visibilitychange/);assert.match(tracker,/sendBeacon/);
});
