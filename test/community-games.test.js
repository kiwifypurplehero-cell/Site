'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const worker = fs.readFileSync('worker.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');

test('expõe catálogo comunitário persistente pelo Worker e D1',()=>{
  assert.match(worker,/url\.pathname==='\/api\/community-games'/);
  assert.match(worker,/env\.DB\.prepare/);
  assert.match(worker,/\.bind\(/);
  assert.doesNotMatch(script,/localStorage\.setItem\([^\n]*community/i);
});
test('formulário público exige autoria e está somente no menu/modal',()=>{
  for(const field of ['githubUrl','name','creator','gameType','description','platform','coverUrl','confirmed']) assert.match(html,new RegExp(`name="${field}"`));
  assert.match(html,/Os jogos enviados ficam públicos na PlumpGames/);
  assert.match(html,/não reivindica autoria de jogos da comunidade/);
});
test('renderização de dados comunitários usa criação segura de nós',()=>{
  assert.match(script,/community-creator/);
  assert.match(script,/textContent/);
  assert.doesNotMatch(script,/innerHTML\s*=.*(?:game\.name|game\.creator|game\.description)/);
});
