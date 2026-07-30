export const meta = {
  name: 'jp-parity-wave1',
  description: 'Japanese parity wave 1 — author + verify 247 cards for nodes 1-4 (furigana, polite register)',
  phases: [{ title: 'Author', detail: 'one agent per ~20-card batch' }, { title: 'Verify', detail: 'adversarial JP + furigana check' }],
};

const TASKS = [{"node":"node-01","focus":"Greetings & set phrases (こんにちは, おはようございます, ありがとうございます, すみません, さようなら, よろしくお願いします). Polite fixed expressions for daily encounters.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-01.json","out":"docs/jp-parity/wave1/node-01-batch1.json"},{"node":"node-01","focus":"Greetings & set phrases (こんにちは, おはようございます, ありがとうございます, すみません, さようなら, よろしくお願いします). Polite fixed expressions for daily encounters.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-01.json","out":"docs/jp-parity/wave1/node-01-batch2.json"},{"node":"node-01","focus":"Greetings & set phrases (こんにちは, おはようございます, ありがとうございます, すみません, さようなら, よろしくお願いします). Polite fixed expressions for daily encounters.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-01.json","out":"docs/jp-parity/wave1/node-01-batch3.json"},{"node":"node-01","focus":"Greetings & set phrases (こんにちは, おはようございます, ありがとうございます, すみません, さようなら, よろしくお願いします). Polite fixed expressions for daily encounters.","count":1,"existingFile":"docs/jp-parity/wave1/existing-node-01.json","out":"docs/jp-parity/wave1/node-01-batch4.json"},{"node":"node-02","focus":"XはYです — topic marker は + polite copula です. Self-intro, nationality, occupation, simple identity statements (わたしは〜です, これは〜です).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-02.json","out":"docs/jp-parity/wave1/node-02-batch1.json"},{"node":"node-02","focus":"XはYです — topic marker は + polite copula です. Self-intro, nationality, occupation, simple identity statements (わたしは〜です, これは〜です).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-02.json","out":"docs/jp-parity/wave1/node-02-batch2.json"},{"node":"node-02","focus":"XはYです — topic marker は + polite copula です. Self-intro, nationality, occupation, simple identity statements (わたしは〜です, これは〜です).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-02.json","out":"docs/jp-parity/wave1/node-02-batch3.json"},{"node":"node-03","focus":"Yes/no questions with か; answering はい/いいえ; negative copula じゃないです / ではありません (〜ですか, いいえ、〜じゃないです).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-03.json","out":"docs/jp-parity/wave1/node-03-batch1.json"},{"node":"node-03","focus":"Yes/no questions with か; answering はい/いいえ; negative copula じゃないです / ではありません (〜ですか, いいえ、〜じゃないです).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-03.json","out":"docs/jp-parity/wave1/node-03-batch2.json"},{"node":"node-03","focus":"Yes/no questions with か; answering はい/いいえ; negative copula じゃないです / ではありません (〜ですか, いいえ、〜じゃないです).","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-03.json","out":"docs/jp-parity/wave1/node-03-batch3.json"},{"node":"node-03","focus":"Yes/no questions with か; answering はい/いいえ; negative copula じゃないです / ではありません (〜ですか, いいえ、〜じゃないです).","count":3,"existingFile":"docs/jp-parity/wave1/existing-node-03.json","out":"docs/jp-parity/wave1/node-03-batch4.json"},{"node":"node-04","focus":"Demonstratives これ/それ/あれ and この/その/あの + noun; どれ/どの; asking これは何ですか and answering.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-04.json","out":"docs/jp-parity/wave1/node-04-batch1.json"},{"node":"node-04","focus":"Demonstratives これ/それ/あれ and この/その/あの + noun; どれ/どの; asking これは何ですか and answering.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-04.json","out":"docs/jp-parity/wave1/node-04-batch2.json"},{"node":"node-04","focus":"Demonstratives これ/それ/あれ and この/その/あの + noun; どれ/どの; asking これは何ですか and answering.","count":20,"existingFile":"docs/jp-parity/wave1/existing-node-04.json","out":"docs/jp-parity/wave1/node-04-batch3.json"},{"node":"node-04","focus":"Demonstratives これ/それ/あれ and この/その/あの + noun; どれ/どの; asking これは何ですか and answering.","count":3,"existingFile":"docs/jp-parity/wave1/existing-node-04.json","out":"docs/jp-parity/wave1/node-04-batch4.json"}];
const bn = p => p.split('/').pop();

const SCHEMA_RULES = [
  'Each card is an object: {target, tokens, english, grammar (optional), grammarNode, tags}.',
  'target: a natural everyday Japanese sentence for THIS node, 3-8 words, ending in the right punctuation (。or ？).',
  'REGISTER: polite です/ます throughout (this is the canon for the whole deck; no plain form until node 19+).',
  'tokens: an array that splits target into word-units, in order. Each token is {t: "surface"} and, IF the surface contains any kanji, also {t, r: "hiragana reading of the whole token"}. Kana-only tokens and punctuation get NO r. The concatenation of every token.t MUST equal target exactly (same characters, same order) — this is lint-enforced.',
  'english: a natural English translation.',
  'grammar (optional): include a short grammar tip on roughly 1 card in 4 where a genuine, useful point applies (skip filler). Chill and factual, one rule, quote a word from the sentence, <=200 chars, no em dash, no markdown. Give the reading + meaning for any Japanese you cite, e.g. 食べます (tabemasu = eat).',
  'grammarNode: exactly "<NODE>".',
  'tags: 1-3 from general, travel, work, family, food, shopping, health, home, weather, time.',
  'Do NOT duplicate or trivially rephrase any sentence in the existing list.',
  'Vary vocabulary, subjects, and situations across the batch — no template stamping.',
];

function authorPrompt(t) {
  return 'You are authoring beginner Japanese flashcards for the ' + t.node + ' grammar node of a spaced-repetition app. Node focus: ' + t.focus + '\n\nRead the existing sentences for this node from `' + t.existingFile + '` (a JSON array of strings) and do NOT repeat them. Author exactly ' + t.count + ' NEW cards. Output a JSON array of ' + t.count + ' card objects and WRITE it to `' + t.out + '` with the Write tool. Return {out, count}.\n\nRULES:\n' + SCHEMA_RULES.map((r,i)=>(i+1)+'. '+r).join('\n');
}
function verifyPrompt(t) {
  return 'Adversarially verify Japanese flashcards in `' + t.out + '` for the ' + t.node + ' node (focus: ' + t.focus + '). For EACH card check: (1) target is natural, correct Japanese in polite です/ます register and fits this node; (2) tokens concatenate EXACTLY to target (same chars/order) — fix any mismatch; (3) every token containing kanji has a correct hiragana r reading, kana/punctuation tokens have none; (4) english is accurate; (5) any grammar tip is correct, one rule, cites a word from the sentence, <=200 chars, no em dash/markdown; (6) no duplicates within the batch or vs the existing list in `' + t.existingFile + '`. FIX problems in place; replace a card only if it is unsalvageable. Overwrite `' + t.out + '` with the corrected JSON array (same count). Return {out, kept, fixed, replaced}.';
}

const AUTHOR_SCHEMA = { type:'object', additionalProperties:false, properties:{ out:{type:'string'}, count:{type:'number'} }, required:['out','count'] };
const VERIFY_SCHEMA = { type:'object', additionalProperties:false, properties:{ out:{type:'string'}, kept:{type:'number'}, fixed:{type:'number'}, replaced:{type:'number'} }, required:['out','kept'] };

log('JP parity wave 1: authoring ' + TASKS.length + ' batches (247 cards, nodes 1-4), then verifying each.');

const results = await pipeline(
  TASKS,
  (t) => agent(authorPrompt(t), { label: 'auth ' + t.node + '/' + bn(t.out), phase: 'Author', agentType: 'general-purpose', schema: AUTHOR_SCHEMA }),
  (a, t) => a ? agent(verifyPrompt(t), { label: 'ver ' + t.node + '/' + bn(t.out), phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA }) : null
);

const byNode = {};
for (let i=0;i<TASKS.length;i++){ const t=TASKS[i], r=results[i]; const N=(byNode[t.node]=byNode[t.node]||{ok:0,failed:0,fixed:0}); if(r){N.ok++;N.fixed+=r.fixed||0;}else N.failed++; }
return { totalBatches: TASKS.length, completed: results.filter(Boolean).length, byNode };
