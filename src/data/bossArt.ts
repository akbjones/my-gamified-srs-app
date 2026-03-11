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
    { name: 'La probeta curiosa',              translation: 'The curious test tube' },
    { name: 'El electrón rebelde',             translation: 'The rebel electron' },
    { name: 'El prisma secreto',               translation: 'The secret prism' },
    { name: 'La molécula danzante',            translation: 'The dancing molecule' },
    { name: 'El campo magnético',              translation: 'The magnetic field' },
    { name: 'El cristal perfecto',             translation: 'The perfect crystal' },
    { name: 'El experimento de Galileo',       translation: "Galileo's experiment" },
    { name: 'El péndulo perpetuo',             translation: 'The perpetual pendulum' },
    { name: 'La reacción en cadena',           translation: 'The chain reaction' },
    { name: 'La nebulosa oscura',              translation: 'The dark nebula' },
    { name: 'El vacío cuántico',               translation: 'The quantum vacuum' },
    { name: 'El acelerador de partículas',     translation: 'The particle accelerator' },
    { name: 'La doble hélice',                 translation: 'The double helix' },
    { name: 'El agujero negro',                translation: 'The black hole' },
    { name: 'La materia oscura',               translation: 'Dark matter' },
    { name: 'La antimateria',                  translation: 'Antimatter' },
    { name: 'La supernova',                    translation: 'The supernova' },
    { name: 'La paradoja temporal',            translation: 'The time paradox' },
    { name: 'La fusión fría',                  translation: 'Cold fusion' },
    { name: 'El entrelazamiento cuántico',     translation: 'Quantum entanglement' },
    { name: 'La singularidad',                 translation: 'The singularity' },
    { name: 'El Big Bang',                     translation: 'The Big Bang' },
  ],
  italian: [
    { name: 'La provetta curiosa',             translation: 'The curious test tube' },
    { name: "L'elettrone ribelle",              translation: 'The rebel electron' },
    { name: 'Il prisma segreto',               translation: 'The secret prism' },
    { name: 'La molecola danzante',            translation: 'The dancing molecule' },
    { name: 'Il campo magnetico',              translation: 'The magnetic field' },
    { name: 'Il cristallo perfetto',           translation: 'The perfect crystal' },
    { name: "L'esperimento di Galileo",        translation: "Galileo's experiment" },
    { name: 'Il pendolo perpetuo',             translation: 'The perpetual pendulum' },
    { name: 'La reazione a catena',            translation: 'The chain reaction' },
    { name: 'La nebulosa oscura',              translation: 'The dark nebula' },
    { name: 'Il vuoto quantistico',            translation: 'The quantum vacuum' },
    { name: "L'acceleratore di particelle",    translation: 'The particle accelerator' },
    { name: 'La doppia elica',                 translation: 'The double helix' },
    { name: 'Il buco nero',                    translation: 'The black hole' },
    { name: 'La materia oscura',               translation: 'Dark matter' },
    { name: "L'antimateria",                   translation: 'Antimatter' },
    { name: 'La supernova',                    translation: 'The supernova' },
    { name: 'Il paradosso temporale',          translation: 'The time paradox' },
    { name: 'La fusione fredda',               translation: 'Cold fusion' },
    { name: "L'entanglement quantistico",      translation: 'Quantum entanglement' },
    { name: 'La singolarità',                  translation: 'The singularity' },
    { name: 'Il Big Bang',                     translation: 'The Big Bang' },
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
