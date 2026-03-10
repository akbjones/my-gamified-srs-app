export interface BossData {
  name: string;       // Spanish name
  translation: string; // English translation
  art: string;         // ASCII art
}

export const BOSS_ART: BossData[] = [
  {
    name: 'El Raton Astuto',
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
    name: 'La Arana Tejedora',
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
    name: 'El Condor Vigilante',
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
    name: 'El Dragon Grunon',
    translation: 'The Grumpy Dragon',
    art: `      /\\_____/\\
     /  o   o  \\
    ( ==  ^  == )
     )         (
    (  \\|||||/  )
     \\ ROOAAR! /
      \\_______/`,
  },
];

export function getBossForIndex(bossIndex: number): BossData {
  return BOSS_ART[bossIndex % BOSS_ART.length];
}
