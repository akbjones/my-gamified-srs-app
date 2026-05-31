#!/usr/bin/env node
const fs = require('fs');
const DECK_PATH = 'src/data/turkish/deck.json';
const REWRITES_PATH = 'scripts/tr-agreement-rewrites.json';
const EDGE_MANIFEST = 'scripts/edge-tts-cards.json';

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const { rewrites } = JSON.parse(fs.readFileSync(REWRITES_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(EDGE_MANIFEST, 'utf8'));

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0;
const newAudioIds = [];
for (const r of rewrites) {
  const card = byId.get(r.id);
  if (!card) continue;
  card.target = r.target;
  card.english = r.english;
  if (r.tags) card.tags = r.tags;
  card.audio = '';
  card.grammar = '';
  newAudioIds.push(r.id);
  applied++;
}
console.log('Turkish agreement rewrites applied: ' + applied);
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

const existing = new Set(manifest.turkish || []);
for (const id of newAudioIds) existing.add(id);
manifest.turkish = [...existing].sort();
manifest._total = Object.entries(manifest).filter(([k]) => !k.startsWith('_')).reduce((s, [_, v]) => s + (Array.isArray(v) ? v.length : 0), 0);
fs.writeFileSync(EDGE_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log('Turkish edge-TTS list now has ' + manifest.turkish.length + ' entries');
