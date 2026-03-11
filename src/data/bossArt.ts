import { Language } from '../types';

export interface BossData {
  name: string;        // localized boss name
  translation: string; // English translation
  color: string;       // hex color for the test tube liquid
}

// ── Test tube liquid colors for 22 bosses (progresses in intensity) ──
const BOSS_COLORS: string[] = [
  '#4ade80', // 0  green-400
  '#34d399', // 1  emerald-400
  '#2dd4bf', // 2  teal-400
  '#22d3ee', // 3  cyan-400
  '#38bdf8', // 4  sky-400
  '#60a5fa', // 5  blue-400
  '#818cf8', // 6  indigo-400
  '#a78bfa', // 7  violet-400
  '#c084fc', // 8  purple-400
  '#e879f9', // 9  fuchsia-400
  '#f472b6', // 10 pink-400
  '#fb7185', // 11 rose-400
  '#f97316', // 12 orange-500
  '#eab308', // 13 yellow-500
  '#ef4444', // 14 red-500
  '#06b6d4', // 15 cyan-500
  '#8b5cf6', // 16 violet-500
  '#d946ef', // 17 fuchsia-500
  '#f43f5e', // 18 rose-500
  '#b91c1c', // 19 red-700
  '#7c3aed', // 20 violet-600 (app accent)
  '#dc2626', // 21 red-600 — final boss
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
  const idx = Math.min(bossIndex, BOSS_COLORS.length - 1);
  const names = (BOSS_NAMES[lang] ?? BOSS_NAMES.spanish)[idx];
  return {
    name: names.name,
    translation: names.translation,
    color: BOSS_COLORS[idx],
  };
}
