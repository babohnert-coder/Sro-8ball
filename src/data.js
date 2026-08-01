import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();

export function rootPath(...parts) {
  return path.join(ROOT, ...parts);
}

export function loadJson(relativePath) {
  if (!cache.has(relativePath)) {
    const fullPath = rootPath(relativePath);
    cache.set(relativePath, JSON.parse(fs.readFileSync(fullPath, 'utf8')));
  }
  return cache.get(relativePath);
}

export function clearDataCache() {
  cache.clear();
}

export function loadRuntimeData() {
  return {
    intents: loadJson('data/ontology/intents.json'),
    domains: loadJson('data/ontology/domains.json'),
    entities: loadJson('data/ontology/entities.json'),
    concepts: loadJson('data/ontology/concepts.json'),
    states: loadJson('data/ontology/states.json'),
    deliveryModes: loadJson('data/ontology/delivery_modes.json'),
    humorGrammar: loadJson('data/ontology/humor_grammar.json'),
    references: loadJson('data/reference/references.json'),
    recognitionConfig: loadJson('data/config/recognition.json'),
    selectionConfig: loadJson('data/config/selection.json'),
    memoryConfig: loadJson('data/config/memory.json'),
    productContract: loadJson('data/config/product_contract.json'),
  };
}
