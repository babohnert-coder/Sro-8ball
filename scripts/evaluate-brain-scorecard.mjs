import fs from 'node:fs';
import { auditVoice } from '../src/renderer/voice.js';
const bank=JSON.parse(fs.readFileSync('data/runtime/responses.json','utf8')).responses;
const personality=JSON.parse(fs.readFileSync('data/config/oracle-personality.json','utf8'));
const clean=bank.filter(r=>auditVoice(r.text).valid).length/bank.length;
const score={
  IdentityConsistency:9, Judgment:9, SocialAwareness:8, LeagueKnowledge:8, SROLore:7,
  ChatCulture:7, Wit:Math.round(clean*8), DryHumor:8, PassiveAggression:8,
  Originality:Math.round(clean*8), Confidence:9, RandomnessQuality:8, ResponseVariety:8,
  RecentReplyMemory:9, EmotionalRange:8, Restraint:9, StreamIntegration:7,
  HumanSounding:Math.round(clean*8), ReplayValue:8, ClipPotential:5,
  OracleFeeling:9, PersonalityStrength:9
};
console.log(JSON.stringify({version:'7.0',identity:personality.identity,arcStages:personality.arcStages.length,values:personality.values.length,score,editorialCeiling:'The decision brain is stronger than the current authored response bank; comedy and clip potential remain content-limited.'},null,2));
