# Mum's Deck – design

A 1,400-sentence birthday deck. Intermediate Latin American Spanish, separate
from the main Spanish deck, lightly gamified, and roughly half personal
sentences about her actual life (Beni, Brannagh, Papylou, the bidet saga…).

## Register & level

- **Latin American Spanish**: ustedes never vosotros; manejar, carro/auto,
  celular, computadora; neutral LatAm rather than any single country's slang
  (she'll use it across contexts, so no heavy mexicanisms like "qué onda").
- **Intermediate-coded basics.** She feels she has the basics down and is
  probably overstating it slightly, so the deck never serves bare-basics
  sentences ("la casa es grande") – instead, basic structures ride inside
  richer clauses ("La casa que alquilamos en Bretaña es más grande de lo que
  parece"). Every node keeps reinforcing core vocab this way.
- Proper nouns stay as they are: Beni, Brannagh, Papylou, Magali, Véro, Twig,
  Scout, Pierre, Anna, Béa, Josselin, Latour de France, Pulborough, Newbury.
- **Ken is her husband** (the 'not to worry' one). Main household characters
  (Ken, Pierre, Anna, Antoine) are UNCAPPED – caps apply to repeated scenes,
  not people. Scene-bits still ledgered (pierre-boardgames, pierre-civic…).
- Quoted English stays English where that's the joke: her husband's
  **'not to worry'** appears verbatim inside the Spanish sentence, as does
  **'my duck'**. Do not translate or paraphrase these.

## Composition (target 1,400)

ONE single deck – no theme taxonomy, no goal filters. Roughly half personal
sentences (her list + additions), half everyday useful intermediate Spanish
(markets, travel, health, opinions, small talk). Her recurring interests
(horseriding, morning sea swims, painting, translation work, tile-making,
the Sussex–Brittany life) appear here and there like anything else – the
clump lint is what keeps any of them from being overdone, not a quota.

**Sanctioned running gags** – deliberate repetition, exempt from the clump lint
at their authored counts (ledger as of batch 3): bidet 3 (escalating), scout 6,
brannagh 3, papylou 4, twig 4, frog 2, political-dishes 2, pierre-civic 3,
reassurance 6 (the 'not to worry' card + the five-riff run, which stays
CONSECUTIVE in the final ordering – it's a bit), ken 5, whales 4, latour 4,
georgia 3, easter 2, egremont 3, ancestors 2, pierre-boardgames 3,
videogames 5, swansea 5 (deadpan civic worship, Egremont-adjacent), benoit 5
(cheats at board games), floppy 5 (the hamster's Easter parallels), bear 3
(zigzag dog), bea-techno 3, reunion 3, pokemon 5, gta 3, coordination 4, sports 5, henri 4
(the beekeeper), gilles 6 (0091 + the chatting-rubbish five), latour-elders 5,
gameboy 3, bookclub 7 (0015 + 0072 + the is-everyone-reading five),
antoine-admin 7 (0034 + 0035 + five), pierre-finances 5, ken-sweet 5.
west-sussex 10, london-culture 10.
Scout grows to 11 (diplomatic-history arc), twig to 9, brannagh to 13
(greatest-horse arc: Aztec/Chinese legends + Saudi offers, user's beats)
(last-hope-of-democracy arc) - user-commissioned counts ARE the cap.
Place name: Latour de France, NO hyphens (user preference). Anything else
repeating 3+ times is a defect.

The "easier said than done" pair is intentional on the English side; the
Spanish deliberately differs (más fácil decirlo que hacerlo vs the proverb
del dicho al hecho hay mucho trecho) so the pair teaches two idioms.

## Humour rule (user rule, 2026-08-10)

NO inventive humour from Claude. The comedy comes from the USER's beats -
Claude executes them faithfully and does not add comic angles, similes or
punchlines of its own ("como si fueran colegas", "cinéticamente creativos"
were cut for this). When a commissioned run names its beats (Aztec legends,
Saudi buyers), stay inside them. Plain and faithful beats clever.

## Authoring boundary (user rule, 2026-08-09)

Claude does NOT invent sentences by extrapolating from the personal material
(no extra whale/Ken/church cards riffed from the ledger). The ONLY themes
Claude builds sentences around are the six originally identified (horseriding,
sea swims, painting, translator, tiles, Sussex-Brittany) - and only AFTER the
user finishes the personal ledger. Explicitly-requested mini-sets (Bolivia,
Brexit, learning-Spanish, the app, mum-isms, the reassurance riffs) were
user-commissioned and are fine. Everyday-slice authoring also waits for the
ledger. Node-gap fills come from asking the user, not inventing.

## Grammar curriculum (20 nodes, ~70 cards each)

mum-n01 Rich description (ser/estar/tener in full clauses)
mum-n02 Reflexives & routines (se toma su tiempo, se ocupa de)
mum-n03 Gustar-family, infinitive subjects, opinions
mum-n04 Preterite
mum-n05 Imperfect (used to / descriptions in the past)
mum-n06 Preterite vs imperfect in one sentence
mum-n07 Present perfect (todavía no ha…)
mum-n08 Past perfect & sequencing
mum-n09 Future, ir a, future of conjecture (me pregunto cuándo instalará…)
mum-n10 Conditional (dirían que…, debería)
mum-n11 Present subjunctive (es importante que reciban…)
mum-n12 Subjunctive after connectors (para que, aunque, cuando, llueva o truene)
mum-n13 Imperfect subjunctive & si-clauses
mum-n14 Commands & exclamations (¡Mira, una ballena!, ¡Qué maravilla!)
mum-n15 Por vs para & preposition nuance
mum-n16 Object pronouns & se lo (les ponemos nombres a los platos)
mum-n17 Reported speech & quoting people
mum-n18 Time structures (hace…que, desde, llevar + gerund)
mum-n19 Relative clauses (que queda lejos, que encuentra en el suelo)
mum-n20 Discourse & nuance (sin embargo, a pesar de, según, no precisamente)

Ordering follows this arc, but personal sentences are assigned to whichever
node their grammar naturally exercises – the seed list already covers 17 of 20.

## Gamification – recommended format

Keep the SRS flashcard as the spine (it's what makes the deck stick), and make
the games *presentation modes of cards she has already met*, so play is
practice, never first exposure:

1. **Tile reorder** (primary): the Spanish sentence's word tiles shuffled;
   assemble in order. Works best at 5–10 words. Powered by a `tokens` field
   generated at build time – no extra authoring. Success grades GOOD,
   giving up grades AGAIN, so games feed FSRS instead of bypassing it.
2. **Cloze pick** (for long sentences): one tile blanked, choose from 3
   distractors drawn from the same node (so distractors are plausible).
3. **Match pairs** (warm-up): 6 es↔en pairs from due cards, optional
   30-second start-of-session game.

Cadence: in a session, every ~8th due card whose sentence fits (5–10 tokens)
is served as a game instead of a flashcard. A toggle in Settings turns games
off entirely. The retired WordTileChallenge component + challengeService are
the implementation skeleton.

## Anti-lazy gate (build before authoring the bulk)

`scripts/mum-deck-lint.cjs`, run on every authoring batch AND the whole set
(the Hindi lesson: batch-scoped checks miss cross-batch repetition):
- scenario families: any non-sanctioned actor/scene 3+ times fails
- near-dup pairs: token-set Jaccard ≥ 0.6 fails
- opening frames: same first-two-words 4+ times fails
- register: vosotros/os/vais forms fail; en-dash only; English glosses natural
- NO SEMICOLONS in the Spanish (user rule 2026-08-10): the punto y coma is
  written-register and rare in Spanish - these are SPOKEN sentences. Use a
  comma + connector (pero, así que, total...), a colon, or two sentences.
  TTS reads ; as a full stop anyway.
- node balance: no node beyond ±25% of target after each merge

## Data flow

1. `docs/mum-deck/inbox.md` – she-facing intake: one English line per idea,
   optional notes in parens. The user pastes new items here.
2. `docs/mum-deck/seed-cards.json` – structured cards
   `{id, en, es, node, gag, status}` (status: seed → verified).
3. Build step turns verified cards into `src/data/mum/deck.json` in QuestCard
   shape (`id: mum-NNNN`, target, english, grammarNode, tokens, priority)
   once ordering is decided.
4. Audio: es-US-Neural2-A (the canonical Spanish voice) – ~1,400 clips ≈ $1.80,
   cost-confirm before generating.

## Integration (decide later, before shipping)

Options: hidden deck behind `?deck=mum` (like ?starter=ja), or a special entry
in the language picker gated by a local flag. Placement test skipped – the deck
IS her placement. SRS, sync, Listen mode all inherit.
