import test from 'node:test'; import assert from 'node:assert/strict'; import { loadJson } from '../src/data.js';
test('worldview has thirty executable commitments',()=>{const w=loadJson('data/config/worldview.json');assert.equal(w.statements.length,30);assert.ok(w.statements.some(x=>x.includes('answers the actual question')));});
