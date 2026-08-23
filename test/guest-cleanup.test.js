import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('visitante é exclusivamente efêmero e não chama endpoint de cadastro',async()=>{
  const [html,auth,script]=await Promise.all([read('index.html'),read('auth.js'),read('script.js')]);
  assert.match(html,/data-guest-login>Entrar como visitante/);
  assert.match(auth,/isGuest:true/);
  assert.match(auth,/window\.PlumpStorage=user\.isGuest/);
  assert.doesNotMatch(auth,/enterGuest[\s\S]{0,500}api\('\/api\/auth\/register/);
  assert.match(script,/if\(window\.PlumpAuth\?\.isGuest\(\)\)return/);
});

test('migration e cron preservam contas conhecidas e protegem administradores',async()=>{
  const [migration,worker,config]=await Promise.all([read('migrations/0006_last_active_at.sql'),read('worker.js'),read('wrangler.jsonc')]);
  assert.match(migration,/ALTER TABLE users ADD COLUMN last_active_at TEXT/);
  assert.match(migration,/SET last_active_at = datetime\('now'\)/);
  assert.match(worker,/role != 'admin'/);
  assert.match(worker,/last_active_at IS NOT NULL/);
  assert.match(worker,/180\*86_400_000/);
  assert.match(worker,/async scheduled/);
  assert.match(config,/"crons": \["17 3 \* \* \*"\]/);
});

test('bottom nav é fixa, respeita safe area e some em fullscreen',async()=>{
  const css=await read('style.css');
  assert.match(css,/#mobile-bottom-nav\{position:fixed/);
  assert.match(css,/padding-bottom:calc\(90px \+ var\(--bottom-safe-offset\)\)/);
  assert.match(css,/:has\(:fullscreen\) #mobile-bottom-nav/);
  assert.match(css,/object-fit:cover;object-position:center/);
});
