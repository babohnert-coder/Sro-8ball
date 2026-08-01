import test from 'node:test';
import assert from 'node:assert/strict';
import { recognizeInquiry } from '../src/recognition/index.js';
import { buildPerceptionBundle, formDecisionPlan } from '../src/brain.js';
import { InMemoryStore } from '../src/memory/in-memory.js';

function plan(text, options={}) {
  const perception=buildPerceptionBundle({bundle:recognizeInquiry(text),repeatedInquiry:options.repeated??false,userHash:'u'});
  return formDecisionPlan({perception,snapshot:options.snapshot??{},seed:options.seed??'v7',personalityVolume:options.volume??6});
}

test('SRO Oracle plan diagnoses behavior and value before choosing language',()=>{
  const result=plan('is this free win');
  assert.equal(result.version,'7.0');
  assert.equal(result.diagnosis.id,'confidence_ahead_of_evidence');
  assert.equal(result.valueAtStake,'humility');
  assert.equal(result.valueAlignment,'challenged');
  assert.ok(result.oracleMode);
});

test('repeated questions expose motive instead of only changing RNG',()=>{
  const result=plan('will sro win lane',{repeated:true});
  assert.equal(result.diagnosis.id,'uncertainty_recycling');
  assert.equal(result.oracleMode,'motive_exposure');
  assert.equal(result.responseMove,'premise_check');
});

test('personality arc reveals more after sustained interaction',()=>{
  const early=plan('will sro win lane',{snapshot:{oracleProfile:{interactionCount:0}}});
  const late=plan('will sro win lane',{snapshot:{oracleProfile:{interactionCount:45}}});
  assert.equal(early.relationshipStage,'distant_observer');
  assert.equal(late.relationshipStage,'room_oracle');
  assert.ok(late.revealDepth>early.revealDepth);
  assert.ok(late.personalityCurve.expressivePressure>=early.personalityCurve.expressivePressure);
});

test('memory accumulates an Oracle relationship profile',async()=>{
  const memory=new InMemoryStore();
  await memory.recordSelection({userHash:'u',routeKey:'r',responseId:'x',semanticFamily:'a',openingFamily:'a',syntaxFamily:'a',replyMove:'straight_verdict',twistFamily:'none',targetFamily:'decision',payoffFamily:'utility',conceptFamilies:[],deliveryMode:'direct',oracleProfileDelta:{interactionCount:1,leagueCount:1,lastValue:'patience',lastDiagnosis:'discipline_under_pressure',lastMode:'clean_verdict'}});
  const snapshot=await memory.getSnapshot('u','r');
  assert.equal(snapshot.oracleProfile.interactionCount,1);
  assert.equal(snapshot.oracleProfile.lastValue,'patience');
});
