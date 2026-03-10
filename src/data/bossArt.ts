export interface BossData {
  name: string;       // Spanish name
  translation: string; // English translation
  art: string;         // ASCII art
}

export const BOSS_ART: BossData[] = [
  {
    name: 'El Ratón Astuto',
    translation: 'The Cunning Mouse',
    art: `    (\\___/)
    (='.'=)
    (")_(")~*`,
  },
  {
    name: 'La Serpiente Sibilante',
    translation: 'The Hissing Snake',
    art: `       /^\\/^\\
      _|__|  o|
 \\/     /~   \\_/ \\
  \\____|__________/
         \\_______/
    ~sssSSSsss~`,
  },
  {
    name: 'El Lobo Hambriento',
    translation: 'The Hungry Wolf',
    art: `     /\\    /\\
    {  \\__/  }
    (  o  o  )
     > -==- <
    /        \\
   / GRRRRRR  \\`,
  },
  {
    name: 'La Araña Tejedora',
    translation: 'The Weaving Spider',
    art: `    /\\  .-"-.  /\\
   //\\\\/  ,  \\//\\\\
   |/\\| .-~~-. |/\\|
    (  @      @  )
     \\ \\      / /
      ^^ \\~~/ ^^`,
  },
  {
    name: 'El Toro Furioso',
    translation: 'The Furious Bull',
    art: `    (__)  (__)
    (oo)\\/(oo)
   __\\/  ~  \\/__
  / |  SNORT  | \\
 *  ||--------||  *
    ^^        ^^`,
  },
  {
    name: 'El Cóndor Vigilante',
    translation: 'The Watchful Condor',
    art: `       .---.
      / o o \\
     ( \\___/ )
    __/|   |\\__
   /   |^^^|   \\
  /~~~~|   |~~~~\\`,
  },
  {
    name: 'El Jaguar Sigiloso',
    translation: 'The Stealthy Jaguar',
    art: `    /\\_/\\
   ( o.o )
    > ^ <
   / | | \\
  (_/   \\_)
   *prowls*`,
  },
  {
    name: 'El Kraken Dormido',
    translation: 'The Sleeping Kraken',
    art: `   ___/\\/\\/\\___
  /  (o)  (o)  \\
 {    ______    }
  \\  /~~~~~~\\  /
 ~~~||~~~~~~||~~~
    ||      ||`,
  },
  {
    name: 'La Quimera Ardiente',
    translation: 'The Burning Chimera',
    art: `   )  ( )  (
  (    Y    )
   )  |||  (
  ( \\|||||/ )
   )||||||||(
  (_/||||||\\_)
  *~FLAMES~*`,
  },
  {
    name: 'El Dragón Gruñón',
    translation: 'The Grumpy Dragon',
    art: `      /\\_____/\\
     /  o   o  \\
    ( ==  ^  == )
     )         (
    (  \\|||||/  )
     \\ ROOAAR! /
      \\_______/`,
  },
  // ── Bosses 11-22 ────────────────────────────
  {
    name: 'La Medusa Petrificante',
    translation: 'The Petrifying Medusa',
    art: `    ~~ ~~~ ~~
    \\|/\\|/\\|/
     ( o _ o )
      \\ === /
     __/   \\__
    *ssstone!*`,
  },
  {
    name: 'El Grifo Dorado',
    translation: 'The Golden Griffin',
    art: `      ,  ,
     (\\  /)
      \\ \\/ /
     /|    |\\
    / | <> | \\
   /~~|    |~~\\
      \\____/`,
  },
  {
    name: 'La Tortuga Ancestral',
    translation: 'The Ancient Turtle',
    art: `    ___-------___
   /               \\
  /  .---.   .---.  \\
 |  ( o  )   ( o  ) |
  \\  '---' ^ '---' /
   \\_____===_____/
   *slow but wise*`,
  },
  {
    name: 'El Cuervo de Sombras',
    translation: 'The Shadow Raven',
    art: `      ,,,
     (o o)
    /(   )\\
   /  )--(  \\
  /  / !! \\  \\
 /__/  !!  \\__\\
   *CAWWW!*`,
  },
  {
    name: 'El Oso Polar',
    translation: 'The Polar Bear',
    art: `    (\\____/)
    / @  @ \\
   (  >wb<  )
    )       (
   (  GRRRR  )
    \\_______/
    *ROAR!!*`,
  },
  {
    name: 'La Mantis Letal',
    translation: 'The Lethal Mantis',
    art: `   \\    /
    \\  /
   (O  O)
    |  |
   /|  |\\
  / |  | \\
    *snip*`,
  },
  {
    name: 'El Tiburón Abismal',
    translation: 'The Abyssal Shark',
    art: `         |\\
         | \\
    |\\   |  \\
    | \\  |   >--<
    |  >-+--'   )
    | /  | \\___/
    |/   |
   *CHOMP!*`,
  },
  {
    name: 'El Golem de Piedra',
    translation: 'The Stone Golem',
    art: `    [=====]
    |  .  .|
    | (__) |
   /|      |\\
  [=|      |=]
    |  /\\  |
    |_/  \\_|
    *THUD!*`,
  },
  {
    name: 'La Fénix Renacida',
    translation: 'The Reborn Phoenix',
    art: `     )  (  )
    ( )  Y (  )
     ) \\||| ( )
    ( ~|||||~ )
     )||||||||(
     *BLAZES!*`,
  },
  {
    name: 'El Minotauro Furioso',
    translation: 'The Raging Minotaur',
    art: `   |\\_____/|
    (  o o  )
     ( _||_ )
    /|  ||  |\\
   / | \\||/ | \\
  *  |======|  *
     *CHARGE!*`,
  },
  {
    name: 'La Hidra Inmortal',
    translation: 'The Immortal Hydra',
    art: `  o   o   o
  |\\  |  /|
   \\ \\|/ /
    \\   /
     | |
    /   \\
   /     \\
  *3 HEADS!*`,
  },
  {
    name: 'El Rey Serpiente',
    translation: 'The Serpent King',
    art: `     .vVVVv.
    /  o  o  \\
   (  \\=====/  )
    \\  \\   /  /
     \\ /^^^\\  /
      V     V
    *HISSSS!*
   **FINAL BOSS**`,
  },
];

export function getBossForIndex(bossIndex: number): BossData {
  return BOSS_ART[Math.min(bossIndex, BOSS_ART.length - 1)];
}
