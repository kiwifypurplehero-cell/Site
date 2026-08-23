import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import worker from '../worker.js';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
test('contas usam PBKDF2 com 100000 iterações e cookie seguro',async()=>{const source=await read('worker.js');assert.match(source,/const PASSWORD_ITERATIONS=100000;/);assert.match(source,/PBKDF2/);assert.match(source,/HttpOnly; Secure; SameSite=Lax/);assert.doesNotMatch(source,/localStorage.*password/i);});
test('diagnósticos temporários isolam hash, sessão e D1 sem expor material sensível',async()=>{
  const disabled=await worker.fetch(authRequest('/api/auth/debug-password',{password:'12345678'}),{},{});assert.equal(disabled.status,404);
  const env={AUTH_DEBUG:'true',DB:{prepare(sql){return {async first(){assert.match(sql,/^SELECT 1 AS ok FROM (users|sessions) LIMIT 1$/);return null;}};}}};
  const password=await worker.fetch(authRequest('/api/auth/debug-password',{password:'12345678'}),env,{});
  assert.equal(password.status,200);const passwordBody=await responseBody(password);assert.deepEqual(passwordBody,{ok:true,stage:'password_hash'});
  const session=await worker.fetch(authRequest('/api/auth/debug-session',{}),env,{});
  assert.equal(session.status,200);const sessionBody=await responseBody(session);assert.deepEqual(sessionBody,{ok:true,stage:'session'});
  const db=await worker.fetch(authRequest('/api/auth/debug-db'),env,{});
  assert.equal(db.status,200);const dbBody=await responseBody(db);assert.deepEqual(dbBody,{ok:true,db:true,usersTable:true,sessionsTable:true});
  for(const body of [passwordBody,sessionBody,dbBody])assert.doesNotMatch(JSON.stringify(body),/12345678|salt|token|cookie|stack|sql/i);
});
test('migration vincula sessões, preferências e playtime ao usuário real',async()=>{const sql=await read('migrations/0004_real_accounts.sql');for(const table of ['users','sessions','user_preferences','play_sessions','play_stats'])assert.match(sql,new RegExp(`CREATE TABLE ${table}`));assert.match(sql,/user_id TEXT NOT NULL REFERENCES users/);});
test('gate adia scripts pesados e biblioteca oferece três modos',async()=>{const [html,auth,library]=await Promise.all([read('index.html'),read('auth.js'),read('components/library/game-library-view.js')]);assert.match(html,/data-auth-form="login"/);assert.doesNotMatch(html,/<script[^>]+src="script\.js"/);assert.match(auth,/\['script\.js'/);for(const mode of ['detailed','list','icons'])assert.match(library,new RegExp(`'${mode}'`));assert.match(library,/abbreviation/);});
test('APIs protegidas derivam identidade somente da sessão',async()=>{const worker=await read('worker.js');assert.match(worker,/async function requireAuth/);assert.doesNotMatch(worker,/X-PlumpGames-Player/);assert.match(worker,/WHERE s\.user_id=\?|WHERE s\.user_id/);});

class MemoryStatement{
  constructor(db,sql){this.db=db;this.sql=sql;this.values=[];}
  bind(...values){this.values=values;return this;}
  async first(){
    if(this.sql.startsWith('SELECT u.id,u.username')){const session=this.db.sessions.get(this.values[0]);const user=session&&session.expires_at>this.values[1]?this.db.users.get(session.user_id):null;return user?{...user,...session}:null;}
    if(this.sql.startsWith('SELECT theme'))return this.db.preferences.get(this.values[0])||null;
    if(this.sql.startsWith('SELECT id FROM users WHERE username'))return [...this.db.users.values()].find(user=>user.username.toLowerCase()===String(this.values[0]).toLowerCase())||null;
    if(this.sql.startsWith('SELECT id,username,password_hash'))return [...this.db.users.values()].find(user=>user.username.toLowerCase()===String(this.values[0]).toLowerCase())||null;
    if(this.sql.startsWith('INSERT INTO users')){const [username,password_hash,display_name]=this.values;if([...this.db.users.values()].some(user=>user.username.toLowerCase()===username.toLowerCase()))throw new Error('UNIQUE constraint failed: users.username');const user={id:this.db.nextId++,username,email:null,password_hash,display_name,avatar:'controller',bio:'',is_public:1,role:'user'};this.db.users.set(user.id,user);return user;}
    if(this.sql.startsWith('SELECT password_hash FROM users'))return this.db.users.get(this.values[0])||null;
    throw new Error(`Unsupported first query: ${this.sql}`);
  }
  async run(){
    if(this.sql.startsWith('INSERT OR IGNORE INTO user_preferences')){const [user_id,updated_at]=this.values;this.db.preferences.set(user_id,{theme:'default',wallpaper:'none',animations:1,view_mode:'detailed',reduce_motion:0,updated_at});return {};}
    if(this.sql.startsWith('INSERT INTO sessions')){const [token_hash,user_id,created_at,expires_at]=this.values;this.db.sessions.set(token_hash,{user_id,created_at,expires_at});return {};}
    if(this.sql.startsWith('DELETE FROM sessions WHERE token_hash')){this.db.sessions.delete(this.values[0]);return {};}
    if(this.sql.startsWith('UPDATE users SET password_hash')){this.db.users.get(this.values[1]).password_hash=this.values[0];return {};}
    if(this.sql.startsWith('DELETE FROM sessions WHERE user_id')){for(const [hash,session] of this.db.sessions)if(session.user_id===this.values[0]&&hash!==this.values[1])this.db.sessions.delete(hash);return {};}
    throw new Error(`Unsupported run query: ${this.sql}`);
  }
}
class MemoryDB{
  constructor(){this.users=new Map();this.sessions=new Map();this.preferences=new Map();this.nextId=1;}
  prepare(sql){return new MemoryStatement(this,sql);}
  async batch(statements){for(const statement of statements)await statement.run();}
}
const authRequest=(path,body,cookie,headers={})=>new Request(`https://plumpgames.example${path}`,{method:body?'POST':'GET',headers:{...(body&&{'Content-Type':'application/json'}),...(cookie&&{Cookie:cookie}),...headers},body:body&&JSON.stringify(body)});
const responseBody=response=>response.json();
const cookieFrom=response=>response.headers.get('Set-Cookie')?.split(';',1)[0];

test('fluxo público de cadastro, sessão, logout e login preserva a conta',async()=>{
  const env={DB:new MemoryDB()};
  const registration=await worker.fetch(authRequest('/api/auth/register',{username:'PlumpTeste',password:'12345678'}),env,{});
  assert.equal(registration.status,201,'cadastro público sem sessão ou token não pode retornar 403');
  const firstCookie=cookieFrom(registration);assert.match(firstCookie,/^plumpgames_session=/);assert.match(registration.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.notEqual(env.DB.users.values().next().value.password_hash,'12345678');

  const reload=await worker.fetch(authRequest('/api/auth/me',null,firstCookie),env,{});assert.equal(reload.status,200);assert.equal((await responseBody(reload)).user.username,'PlumpTeste');
  const duplicate=await worker.fetch(authRequest('/api/auth/register',{username:'plumpteste',password:'12345678'}),env,{});assert.equal(duplicate.status,409);assert.equal((await responseBody(duplicate)).code,'USERNAME_TAKEN');
  const badPassword=await worker.fetch(authRequest('/api/auth/login',{username:'PlumpTeste',password:'senha-errada'}),env,{});assert.equal(badPassword.status,401);assert.equal((await responseBody(badPassword)).code,'INVALID_CREDENTIALS');

  const logout=await worker.fetch(authRequest('/api/auth/logout',{},firstCookie,{'X-PlumpGames-Request':'same-origin'}),env,{});assert.equal(logout.status,200);
  const expired=await worker.fetch(authRequest('/api/auth/me',null,firstCookie),env,{});assert.equal(expired.status,401);
  const login=await worker.fetch(authRequest('/api/auth/login',{username:'plumpteste',password:'12345678'}),env,{});assert.equal(login.status,200);assert.equal((await responseBody(login)).user.username,'PlumpTeste');
  const secondCookie=cookieFrom(login);assert.notEqual(secondCookie,firstCookie);
  const restored=await worker.fetch(authRequest('/api/auth/me',null,secondCookie),env,{});assert.equal(restored.status,200);assert.deepEqual((await responseBody(restored)).preferences,{theme:'default',libraryView:'detailed',liveWallpaper:'none',animations:true,reduceMotion:false});
});

test('origem cruzada é recusada sem tornar cadastro e login dependentes de sessão',async()=>{
  const env={DB:new MemoryDB()};
  for(const path of ['/api/auth/register','/api/auth/login']){
    const response=await worker.fetch(authRequest(path,{username:'PlumpTeste',password:'12345678'},null,{Origin:'https://evil.example'}),env,{});
    assert.equal(response.status,403);assert.equal((await responseBody(response)).code,'ORIGIN_NOT_ALLOWED');
  }
  const privateResponse=await worker.fetch(authRequest('/api/auth/logout',{},null,{'X-PlumpGames-Request':'same-origin'}),env,{});assert.equal(privateResponse.status,401);
});

test('cadastro valida username e senha e persiste somente hash versionado',async()=>{
  const env={DB:new MemoryDB()};
  assert.equal((await worker.fetch(authRequest('/api/auth/register',{username:'ab',password:'12345678'}),env,{})).status,400);
  assert.equal((await worker.fetch(authRequest('/api/auth/register',{username:'usuario',password:'1234567'}),env,{})).status,400);
  const response=await worker.fetch(authRequest('/api/auth/register',{username:'Usuario',password:'12345678'}),env,{});
  assert.equal(response.status,201);const stored=env.DB.users.values().next().value;
  assert.equal(stored.email,null);assert.equal(stored.display_name,'Usuario');assert.match(stored.password_hash,/^pbkdf2-sha256\$100000\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
  assert.doesNotMatch(JSON.stringify(await response.json()),/password|hash|token/i);
});

test('hashPassword usa 100000 iterações, verifica a senha e gera salt individual',async()=>{
  const env={DB:new MemoryDB()};
  const first=await worker.fetch(authRequest('/api/auth/register',{username:'HashUm',password:'12345678'}),env,{});
  const second=await worker.fetch(authRequest('/api/auth/register',{username:'HashDois',password:'12345678'}),env,{});
  assert.equal(first.status,201);assert.equal(second.status,201);
  const [firstHash,secondHash]=[...env.DB.users.values()].map(user=>user.password_hash);
  for(const hash of [firstHash,secondHash])assert.match(hash,/^pbkdf2-sha256\$100000\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
  assert.notEqual(firstHash.split('$')[2],secondHash.split('$')[2]);
  const login=await worker.fetch(authRequest('/api/auth/login',{username:'HashUm',password:'12345678'}),env,{});
  assert.equal(login.status,200);
});

test('hash acima do limite atual é recusado sem causar erro interno',async()=>{
  const env={DB:new MemoryDB()};
  await worker.fetch(authRequest('/api/auth/register',{username:'HashAntigo',password:'12345678'}),env,{});
  const stored=env.DB.users.values().next().value;
  stored.password_hash=stored.password_hash.replace('$100000$','$210000$');
  const login=await worker.fetch(authRequest('/api/auth/login',{username:'HashAntigo',password:'12345678'}),env,{});
  assert.equal(login.status,401);assert.equal((await responseBody(login)).code,'INVALID_CREDENTIALS');
});

test('login aceita o formato PBKDF2 legado para preservar usuários existentes',async()=>{
  const env={DB:new MemoryDB()};
  const registration=await worker.fetch(authRequest('/api/auth/register',{username:'HashLegado',password:'senha-legada'}),env,{});
  const stored=env.DB.users.values().next().value;
  stored.password_hash=stored.password_hash.replace(/^pbkdf2-sha256\$/, 'pbkdf2$sha256$');
  const login=await worker.fetch(authRequest('/api/auth/login',{username:'HashLegado',password:'senha-legada'}),env,{});
  assert.equal(registration.status,201);assert.equal(login.status,200);
});

test('alteração de senha invalida a antiga e permite a nova',async()=>{
  const env={DB:new MemoryDB()};
  const registration=await worker.fetch(authRequest('/api/auth/register',{username:'TrocaSenha',password:'senha-antiga'}),env,{});const cookie=cookieFrom(registration);
  const changed=await worker.fetch(authRequest('/api/auth/change-password',{currentPassword:'senha-antiga',newPassword:'senha-nova'},cookie,{'X-PlumpGames-Request':'same-origin'}),env,{});assert.equal(changed.status,200);
  assert.equal((await worker.fetch(authRequest('/api/auth/login',{username:'TrocaSenha',password:'senha-antiga'}),env,{})).status,401);
  assert.equal((await worker.fetch(authRequest('/api/auth/login',{username:'TrocaSenha',password:'senha-nova'}),env,{})).status,200);
});

test('migration torna email nulo preservando ids, dados e binding real',async()=>{
  const [sql,config]=await Promise.all([read('migrations/0005_optional_email_and_current_schema.sql'),read('wrangler.jsonc')]);
  assert.match(sql,/email TEXT COLLATE NOCASE/);assert.doesNotMatch(sql,/email TEXT NOT NULL/);assert.match(sql,/INSERT INTO users_new[\s\S]*SELECT id,username,email/);assert.match(sql,/UNIQUE INDEX users_username_nocase_uq/);
  assert.match(config,/"binding": "DB"/);assert.match(config,/"database_name": "plumpgames-auth"/);
});

test('bootstrap consulta auth/me uma vez, envia cookie e diferencia 401 de falha temporária',async()=>{
  const auth=await read('auth.js');
  assert.match(auth,/credentials:'include'/);
  assert.match(auth,/cache:'no-store'/);
  assert.match(auth,/if\(authBootstrapPromise\)return authBootstrapPromise/);
  assert.doesNotMatch(auth,/setTimeout\(\(\)=>authController\.abort/);
  assert.match(auth,/else if\(error\.status===401\)\{status\.textContent=''\;\}/);
  assert.match(auth,/retry\.onclick=\(\)=>\{authBootstrapPromise=null;restoreSession\(\);\}/);
});

test('auth/me não usa cache público e falha de D1 não limpa cookie nem vira 401',async()=>{
  const env={DB:{prepare(){throw Object.assign(new Error('D1_ERROR: database unavailable'),{name:'D1Error'});}}};
  const response=await worker.fetch(authRequest('/api/auth/me',null,'plumpgames_session=token-persistente'),env,{});
  assert.equal(response.status,503);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Set-Cookie'),null);
  assert.equal((await responseBody(response)).code,'AUTH_SERVICE_UNAVAILABLE');
});
