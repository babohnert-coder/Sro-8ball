import test from 'node:test'; import assert from 'node:assert/strict'; import { recognizeInquiry } from '../src/recognition/index.js'; import { buildPerceptionBundle } from '../src/brain.js';
test('repeat changes motive to reassurance loop',()=>{const b=recognizeInquiry('will sro win lane');assert.equal(buildPerceptionBundle({bundle:b,repeatedInquiry:true}).motive.label,'reassurance_loop');});
