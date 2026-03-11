import { Language } from '../types';

export interface BossData {
  name: string;        // localized boss name
  translation: string; // English translation
  art: string;         // ASCII art (shared across languages)
}

// ── Shared ASCII art for all 22 bosses ─────────────────────────
const BOSS_ART_SHARED: string[] = [
  /* 0 */ `    (\\___/)
    (='.'=)
    (")_(")~*`,

  /* 1 */ `       /^\\/^\\
      _|__|  o|
 \\/     /~   \\_/ \\
  \\____|__________/
         \\_______/
    ~sssSSSsss~`,

  /* 2 */ `     /\\    /\\
    {  \\__/  }
    (  o  o  )
     > -==- <
    /        \\
   / GRRRRRR  \\`,

  /* 3 */ `    /\\  .-"-.  /\\
   //\\\\/  ,  \\//\\\\
   |/\\| .-~~-. |/\\|
    (  @      @  )
     \\ \\      / /
      ^^ \\~~/ ^^`,

  /* 4 */ `    (__)  (__)
    (oo)\\/(oo)
   __\\/  ~  \\/__
  / |  SNORT  | \\
 *  ||--------||  *
    ^^        ^^`,

  /* 5 */ `       .---.
      / o o \\
     ( \\___/ )
    __/|   |\\__
   /   |^^^|   \\
  /~~~~|   |~~~~\\`,

  /* 6 */ `    /\\_/\\
   ( o.o )
    > ^ <
   / | | \\
  (_/   \\_)
   *prowls*`,

  /* 7 */ `   ___/\\/\\/\\___
  /  (o)  (o)  \\
 {    ______    }
  \\  /~~~~~~\\  /
 ~~~||~~~~~~||~~~
    ||      ||`,

  /* 8 */ `   )  ( )  (
  (    Y    )
   )  |||  (
  ( \\|||||/ )
   )||||||||(
  (_/||||||\\_)
  *~FLAMES~*`,

  /* 9 */ `      /\\_____/\\
     /  o   o  \\
    ( ==  ^  == )
     )         (
    (  \\|||||/  )
     \\ ROOAAR! /
      \\_______/`,

  /* 10 */ `    ~~ ~~~ ~~
    \\|/\\|/\\|/
     ( o _ o )
      \\ === /
     __/   \\__
    *ssstone!*`,

  /* 11 */ `      ,  ,
     (\\  /)
      \\ \\/ /
     /|    |\\
    / | <> | \\
   /~~|    |~~\\
      \\____/`,

  /* 12 */ `    ___-------___
   /               \\
  /  .---.   .---.  \\
 |  ( o  )   ( o  ) |
  \\  '---' ^ '---' /
   \\_____===_____/
   *slow but wise*`,

  /* 13 */ `      ,,,
     (o o)
    /(   )\\
   /  )--(  \\
  /  / !! \\  \\
 /__/  !!  \\__\\
   *CAWWW!*`,

  /* 14 */ `    (\\____/)
    / @  @ \\
   (  >wb<  )
    )       (
   (  GRRRR  )
    \\_______/
    *ROAR!!*`,

  /* 15 */ `   \\    /
    \\  /
   (O  O)
    |  |
   /|  |\\
  / |  | \\
    *snip*`,

  /* 16 */ `         |\\
         | \\
    |\\   |  \\
    | \\  |   >--<
    |  >-+--'   )
    | /  | \\___/
    |/   |
   *CHOMP!*`,

  /* 17 */ `    [=====]
    |  .  .|
    | (__) |
   /|      |\\
  [=|      |=]
    |  /\\  |
    |_/  \\_|
    *THUD!*`,

  /* 18 */ `     )  (  )
    ( )  Y (  )
     ) \\||| ( )
    ( ~|||||~ )
     )||||||||(
     *BLAZES!*`,

  /* 19 */ `   |\\_____/|
    (  o o  )
     ( _||_ )
    /|  ||  |\\
   / | \\||/ | \\
  *  |======|  *
     *CHARGE!*`,

  /* 20 */ `  o   o   o
  |\\  |  /|
   \\ \\|/ /
    \\   /
     | |
    /   \\
   /     \\
  *3 HEADS!*`,

  /* 21 */ `     .vVVVv.
    /  o  o  \\
   (  \\=====/  )
    \\  \\   /  /
     \\ /^^^\\  /
      V     V
    *HISSSS!*
   **FINAL BOSS**`,
];

// ── Per-language boss names ────────────────────────────────────
interface BossName { name: string; translation: string; }

export const BOSS_NAMES: Record<string, BossName[]> = {
  spanish: [
    { name: 'El Ratón Astuto',          translation: 'The Cunning Mouse' },
    { name: 'La Serpiente Sibilante',    translation: 'The Hissing Snake' },
    { name: 'El Lobo Hambriento',        translation: 'The Hungry Wolf' },
    { name: 'La Araña Tejedora',         translation: 'The Weaving Spider' },
    { name: 'El Toro Furioso',           translation: 'The Furious Bull' },
    { name: 'El Cóndor Vigilante',       translation: 'The Watchful Condor' },
    { name: 'El Jaguar Sigiloso',        translation: 'The Stealthy Jaguar' },
    { name: 'El Kraken Dormido',         translation: 'The Sleeping Kraken' },
    { name: 'La Quimera Ardiente',       translation: 'The Burning Chimera' },
    { name: 'El Dragón Gruñón',          translation: 'The Grumpy Dragon' },
    { name: 'La Medusa Petrificante',    translation: 'The Petrifying Medusa' },
    { name: 'El Grifo Dorado',           translation: 'The Golden Griffin' },
    { name: 'La Tortuga Ancestral',      translation: 'The Ancient Turtle' },
    { name: 'El Cuervo de Sombras',      translation: 'The Shadow Raven' },
    { name: 'El Oso Polar',              translation: 'The Polar Bear' },
    { name: 'La Mantis Letal',           translation: 'The Lethal Mantis' },
    { name: 'El Tiburón Abismal',        translation: 'The Abyssal Shark' },
    { name: 'El Golem de Piedra',        translation: 'The Stone Golem' },
    { name: 'La Fénix Renacida',         translation: 'The Reborn Phoenix' },
    { name: 'El Minotauro Furioso',      translation: 'The Raging Minotaur' },
    { name: 'La Hidra Inmortal',         translation: 'The Immortal Hydra' },
    { name: 'El Rey Serpiente',          translation: 'The Serpent King' },
  ],
  italian: [
    { name: 'Il Topo Astuto',            translation: 'The Cunning Mouse' },
    { name: 'Il Serpente Sibilante',     translation: 'The Hissing Snake' },
    { name: 'Il Lupo Affamato',          translation: 'The Hungry Wolf' },
    { name: 'Il Ragno Tessitore',        translation: 'The Weaving Spider' },
    { name: 'Il Toro Furioso',           translation: 'The Furious Bull' },
    { name: 'Il Condor Vigile',          translation: 'The Watchful Condor' },
    { name: 'Il Giaguaro Furtivo',       translation: 'The Stealthy Jaguar' },
    { name: 'Il Kraken Dormiente',       translation: 'The Sleeping Kraken' },
    { name: 'La Chimera Ardente',        translation: 'The Burning Chimera' },
    { name: 'Il Drago Scontroso',        translation: 'The Grumpy Dragon' },
    { name: 'La Medusa Pietrificante',   translation: 'The Petrifying Medusa' },
    { name: 'Il Grifone Dorato',         translation: 'The Golden Griffin' },
    { name: 'La Tartaruga Ancestrale',   translation: 'The Ancient Turtle' },
    { name: 'Il Corvo delle Ombre',      translation: 'The Shadow Raven' },
    { name: "L'Orso Polare",             translation: 'The Polar Bear' },
    { name: 'La Mantide Letale',         translation: 'The Lethal Mantis' },
    { name: 'Lo Squalo Abissale',        translation: 'The Abyssal Shark' },
    { name: 'Il Golem di Pietra',        translation: 'The Stone Golem' },
    { name: 'La Fenice Rinata',          translation: 'The Reborn Phoenix' },
    { name: 'Il Minotauro Furioso',      translation: 'The Raging Minotaur' },
    { name: "L'Idra Immortale",          translation: 'The Immortal Hydra' },
    { name: 'Il Re Serpente',            translation: 'The Serpent King' },
  ],
  // german / french: add when those languages get decks
};

// ── Public API ─────────────────────────────────────────────────
export function getBossForIndex(bossIndex: number, lang: Language): BossData {
  const idx = Math.min(bossIndex, BOSS_ART_SHARED.length - 1);
  const names = (BOSS_NAMES[lang] ?? BOSS_NAMES.spanish)[idx];
  return {
    name: names.name,
    translation: names.translation,
    art: BOSS_ART_SHARED[idx],
  };
}
