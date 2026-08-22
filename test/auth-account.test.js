import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import worker from '../worker.js';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
test('contas usam PBKDF2, salt individual e cookie seguro',async()=>{const worker=await read('worker.js');assert.match(worker,/PBKDF2/);assert.match(worker,/210000/);assert.match(worker,/HttpOnly; Secure; SameSite=Lax/);assert.doesNotMatch(worker,/localStorage.*password/i);});
test('migration vincula sessões, preferências e playtime ao usuário real',async()=>{const sql=await read('migrations/0004_real_accounts.sql');for(const table of ['users','sessions','user_preferences','play_sessions','play_stats'])assert.match(sql,new RegExp(`CREATE TABLE ${table}`));assert.match(sql,/user_id TEXT NOT NULL REFERENCES users/);});
test('gate adia scripts pesados e biblioteca oferece três modos',async()=>{const [html,auth,library]=await Promise.all([read('index.html'),read('auth.js'),read('components/library/game-library-view.js')]);assert.match(html,/data-auth-form="login"/);assert.doesNotMatch(html,/<script[^>]+src="script\.js"/);assert.match(auth,/\['script\.js'/);for(const mode of ['detailed','list','icons'])assert.match(library,new RegExp(`'${mode}'`));assert.match(library,/abbreviation/);});
test('APIs protegidas derivam identidade somente da sessão',async()=>{const worker=await read('worker.js');assert.match(worker,/async function requireAuth/);assert.doesNotMatch(worker,/X-PlumpGames-Player/);assert.match(worker,/WHERE s\.user_id=\?|WHERE s\.user_id/);});

class MemoryStatement{
  constructor(db,sql){this.db=db;this.sql=sql;this.values=[];}
  bind(...values){this.values=values;return this;}
  async first(){
    if(this.sql.startsWith('SELECT u.id,u.username')){const session=this.db.sessions.get(this.values[0]);const user=session&&session.expires_at>this.values[1]?this.db.users.get(session.user_id):null;return user?{...user,...session}:null;}
    if(this.sql.startsWith('SELECT library_view'))return this.db.preferences.get(this.values[0])||null;
    if(this.sql.startsWith('SELECT * FROM users'))return [...this.db.users.values()].find(user=>user.username_normalized===this.values[0])||null;
    throw new Error(`Unsupported first query: ${this.sql}`);
  }
  async run(){
    if(this.sql.startsWith('INSERT INTO users')){const [id,username,username_normalized,password_hash,password_salt,created_at]=this.values;if([...this.db.users.values()].some(user=>user.username_normalized===username_normalized))throw new Error('UNIQUE constraint failed: users.username_normalized');this.db.users.set(id,{id,username,username_normalized,password_hash,password_salt,created_at});return {};}
    if(this.sql.startsWith('INSERT INTO user_preferences')){const [user_id,updated_at]=this.values;this.db.preferences.set(user_id,{library_view:'detailed',live_wallpaper:'none',settings_json:'{}',updated_at});return {};}
    if(this.sql.startsWith('INSERT INTO sessions')){const [token_hash,user_id,created_at,expires_at,last_seen_at]=this.values;this.db.sessions.set(token_hash,{user_id,created_at,expires_at,last_seen_at});return {};}
    if(this.sql.startsWith('UPDATE users SET last_login_at')){this.db.users.get(this.values[1]).last_login_at=this.values[0];return {};}
    if(this.sql.startsWith('UPDATE sessions SET last_seen_at')){this.db.sessions.get(this.values[1]).last_seen_at=this.values[0];return {};}
    if(this.sql.startsWith('DELETE FROM sessions WHERE token_hash')){this.db.sessions.delete(this.values[0]);return {};}
    throw new Error(`Unsupported run query: ${this.sql}`);
  }
}
class MemoryDB{
  constructor(){this.users=new Map();this.sessions=new Map();this.preferences=new Map();}
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
  const restored=await worker.fetch(authRequest('/api/auth/me',null,secondCookie),env,{});assert.equal(restored.status,200);assert.deepEqual((await responseBody(restored)).preferences,{libraryView:'detailed',liveWallpaper:'none',settings:{}});
});

test('origem cruzada é recusada sem tornar cadastro e login dependentes de sessão',async()=>{
  const env={DB:new MemoryDB()};
  for(const path of ['/api/auth/register','/api/auth/login']){
    const response=await worker.fetch(authRequest(path,{username:'PlumpTeste',password:'12345678'},null,{Origin:'https://evil.example'}),env,{});
    assert.equal(response.status,403);assert.equal((await responseBody(response)).code,'ORIGIN_NOT_ALLOWED');
  }
  const privateResponse=await worker.fetch(authRequest('/api/auth/logout',{},null,{'X-PlumpGames-Request':'same-origin'}),env,{});assert.equal(privateResponse.status,401);
});
