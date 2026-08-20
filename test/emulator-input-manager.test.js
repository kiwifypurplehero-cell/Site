import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTROL_PROFILES,diagnostics,displayCode} from '../emulator-input-manager.js';

test('profiles expose only each core control set',()=>{
  assert.equal(CONTROL_PROFILES.gbc.controls.length,8);
  assert.equal(CONTROL_PROFILES.gba.controls.length,10);
  assert.equal(CONTROL_PROFILES.ps1.controls.length,16);
  assert.deepEqual(CONTROL_PROFILES.gba.controls.map(([id])=>id),['up','down','left','right','a','b','l','r','start','select']);
});

test('diagnostics update configured, unique and conflicts from bindings',()=>{
  const profile=CONTROL_PROFILES.gbc;
  const bindings={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',a:'KeyZ',b:'',start:'Enter',select:'KeyZ'};
  let result=diagnostics(profile,bindings);
  assert.equal(result.configured,7);
  assert.equal(result.total,8);
  assert.equal(result.unique,6);
  assert.equal(result.conflicts.length,1);
  assert.deepEqual([...result.conflictingIds].sort(),['a','select']);
  bindings.b='KeyX';
  bindings.select='ShiftLeft';
  result=diagnostics(profile,bindings);
  assert.equal(result.configured,8);
  assert.equal(result.unique,8);
  assert.equal(result.conflicts.length,0);
});

test('physical codes have readable labels',()=>{
  assert.equal(displayCode('KeyZ'),'Z');
  assert.equal(displayCode('ArrowUp'),'↑');
  assert.equal(displayCode('ShiftLeft'),'Shift (esq.)');
});
