import fs from 'node:fs';
const worldview=JSON.parse(fs.readFileSync('data/config/worldview.json','utf8'));
const rules=JSON.parse(fs.readFileSync('data/config/decision-rules.json','utf8'));
const brain=JSON.parse(fs.readFileSync('data/config/brain-v6.json','utf8'));
const oracle=JSON.parse(fs.readFileSync('data/config/oracle-personality.json','utf8'));
const ok=worldview.statements.length===30&&rules.rules.length===20&&Object.keys(brain.stances).length===10&&oracle.values.length===10&&oracle.arcStages.length===4&&oracle.voiceLaws.length>=10;
console.log(JSON.stringify({ok,identity:oracle.identity,worldview:worldview.statements.length,rules:rules.rules.length,stances:Object.keys(brain.stances).length,values:oracle.values.length,arcStages:oracle.arcStages.length,voiceLaws:oracle.voiceLaws.length},null,2));
if(!ok)process.exitCode=1;
