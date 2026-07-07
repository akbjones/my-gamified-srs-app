/**
 * Indonesian "conjugation" engine — affix derivation, not tense inflection.
 *
 * Indonesian verbs do not conjugate for tense or person; the popover
 * table instead shows the root's productive voice/derivation forms:
 *
 *   akar (root)      – tulis
 *   meN- (active)    – menulis
 *   di- (passive)    – ditulis
 *   ter- (stative)   – tertulis
 *   ber- (middle)    – bertulis (mechanical; not all roots use ber-)
 *   -kan / -i        – menuliskan / menulisi
 *
 * The meN- prefix assimilates to the root onset — this is the entire
 * trick of Indonesian verb morphology, in both directions:
 *
 *   p → mem-  (pukul → memukul,  onset DROPPED)
 *   b → mem-  (baca  → membaca,  onset kept)
 *   t → men-  (tulis → menulis,  onset dropped)
 *   d → men-  (dengar→ mendengar, kept)
 *   k → meng- (kirim → mengirim, dropped)
 *   g/h/vowel → meng- (ambil → mengambil, kept)
 *   s → meny- (sapu  → menyapu,  dropped)
 *   c/j → men- (cari → mencari, kept)
 *   l/m/n/r/w/y → me- (lihat → melihat, kept)
 *   monosyllables → menge- (cat → mengecat)
 *
 * findInfinitive reverses this: dropped onsets are ambiguous
 * (menulis → tulis, but also hypothetical "nulis"), so candidates are
 * checked against KNOWN_ROOTS / the dictionary before falling back.
 */

export interface ConjugationTable {
  verb: string;
  tenses: Record<string, string[]>;
}

// Roots the engine treats as verbs. Grows with the deck; findInfinitive
// validates reversal candidates against this set first.
export const KNOWN_ROOTS = new Set<string>([
  'makan', 'minum', 'tulis', 'baca', 'lihat', 'dengar', 'bicara',
  'pergi', 'datang', 'pulang', 'tidur', 'bangun', 'duduk', 'berdiri',
  'beli', 'jual', 'bayar', 'kerja', 'main', 'jalan', 'lari',
  'ambil', 'bawa', 'kasih', 'terima', 'kirim', 'tunggu', 'cari',
  'temu', 'tanya', 'jawab', 'tolong', 'bantu', 'buka', 'tutup',
  'mulai', 'selesai', 'coba', 'pakai', 'buat', 'masak', 'cuci',
  'ajar', 'belajar', 'kenal', 'tahu', 'ingat', 'lupa', 'pikir',
  'rasa', 'suka', 'cinta', 'sayang', 'harap', 'mau', 'ingin',
  'butuh', 'perlu', 'punya', 'dapat', 'bisa', 'sapu', 'pukul',
  'tinggal', 'hidup', 'mati', 'sakit', 'sembuh', 'ubah', 'ganti',
  // pilot-deck roots (batch B/D bare roots + derived-form roots)
  'nikah', 'kumpul', 'angkat', 'henti', 'lambat', 'dekat',
  'tiba', 'sarapan', 'naik', 'mandi', 'masuk', 'keluar',
  'tonton', 'tawar', 'pesan', 'jemput', 'antar', 'parkir',
  'ada', 'boleh', 'belok', 'jumpa', 'lewat', 'terbit', 'minta', 'turun',
]);

const VOWELS = 'aiueo';

/** Apply meN- to a root with standard assimilation. */
export function applyMeN(root: string): string {
  if (!root) return root;
  const first = root[0];
  const rest = root.slice(1);
  // Monosyllabic roots take menge- (cat → mengecat)
  const syllables = root.split('').filter(c => VOWELS.includes(c)).length;
  if (syllables <= 1) return 'menge' + root;
  switch (first) {
    case 'p': return 'mem' + rest;          // onset dropped
    case 'b': case 'f': case 'v': return 'mem' + root;
    case 't': return 'men' + rest;          // onset dropped
    case 'd': case 'c': case 'j': case 'z': return 'men' + root;
    case 'k': return 'meng' + rest;         // onset dropped
    case 'g': case 'h': case 'q': return 'meng' + root;
    case 's': return 'meny' + rest;         // onset dropped
    case 'a': case 'i': case 'u': case 'e': case 'o': return 'meng' + root;
    default: return 'me' + root;            // l m n r w y ny ng
  }
}

/** ber- irregulars, plus roots whose ber- form takes reciprocal -an. */
function applyBer(root: string): string {
  if (root === 'ajar') return 'belajar';
  if (root === 'kerja') return 'bekerja';
  if (root === 'kenal') return 'berkenalan'; // reciprocal -an is the real form
  if (root.startsWith('r')) return 'be' + root; // berenang-class (renang)
  return 'ber' + root;
}

/** Roots with a lexicalized per-…-kan causative worth a table row. */
const PER_KAN: Record<string, string[]> = {
  kenal: ['perkenalkan', 'memperkenalkan'],
  boleh: ['perbolehkan', 'memperbolehkan'],
};

export function conjugate(rootOrForm: string): ConjugationTable | null {
  if (!rootOrForm) return null;
  const w = rootOrForm.toLowerCase().trim();
  // Accept a derived form and normalize to its root
  const root = KNOWN_ROOTS.has(w) ? w : (findInfinitive(w) ?? w);
  if (!/^[a-z-]+$/.test(root)) return null;

  const meN = applyMeN(root);
  const tenses: Record<string, string[]> = {
    'Akar (Root)': [root],
    'meN- (Active)': [meN],
    'di- (Passive)': ['di' + root],
    'ter- (Stative)': ['ter' + root],
    'ber- (Middle)': [applyBer(root)],
    '-kan (Causative)': [root + 'kan', meN + 'kan', 'di' + root + 'kan'],
    '-i (Locative)': [root + 'i', meN + 'i', 'di' + root + 'i'],
  };
  if (PER_KAN[root]) tenses['per-…-kan (Causative)'] = PER_KAN[root];
  return { verb: root, tenses };
}

// ── findInfinitive: derived form → root ─────────────────────────

/** Undo meN- assimilation. Returns candidate roots, most likely first. */
function reverseMeN(form: string): string[] {
  const out: string[] = [];
  if (form.startsWith('menge')) {
    const rest = form.slice(5);
    if (rest) out.push(rest);              // mengecat → cat
    out.push('nge' + rest);
  }
  if (form.startsWith('meny')) out.push('s' + form.slice(4), 'ny' + form.slice(4));
  if (form.startsWith('meng')) out.push(form.slice(4), 'k' + form.slice(4));
  if (form.startsWith('mem')) out.push('p' + form.slice(3), form.slice(3), form.slice(2), 'm' + form.slice(3));
  if (form.startsWith('men')) out.push('t' + form.slice(3), form.slice(3), 'n' + form.slice(3));
  if (form.startsWith('me')) out.push(form.slice(2));
  return out.filter(Boolean);
}

const STRIP_SUFFIXES = ['kannya', 'inya', 'kanlah', 'ilah', 'kan', 'lah', 'kah', 'nya', 'i', 'an'];

export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = form.toLowerCase().trim();
  if (KNOWN_ROOTS.has(w)) return w;

  // Suffix variants of the bare form and of each prefix-stripped candidate
  const bases = [w];
  for (const suf of STRIP_SUFFIXES) {
    if (w.endsWith(suf) && w.length > suf.length + 2) bases.push(w.slice(0, -suf.length));
  }

  for (const base of bases) {
    if (KNOWN_ROOTS.has(base)) return base;
    const candidates: string[] = [];
    if (base.startsWith('me')) candidates.push(...reverseMeN(base));
    if (base.startsWith('diper')) candidates.push(base.slice(5));
    if (base.startsWith('memper')) candidates.push(base.slice(6));
    if (base.startsWith('per')) candidates.push(base.slice(3));
    if (base.startsWith('di')) candidates.push(base.slice(2));
    if (base.startsWith('ter')) candidates.push(base.slice(3));
    if (base === 'belajar') candidates.push('ajar');
    if (base === 'bekerja') candidates.push('kerja');
    if (base.startsWith('ber')) candidates.push(base.slice(3));
    if (base.startsWith('be') && base[2] === 'r') candidates.push(base.slice(2)); // berenang → renang
    if (base.startsWith('pe')) candidates.push(...reverseMeN('me' + base.slice(2))); // agent nouns share assimilation
    if (base.startsWith('ke') && base.endsWith('an')) candidates.push(base.slice(2, -2));
    for (const c of candidates) {
      if (KNOWN_ROOTS.has(c)) return c;
    }
  }
  return null;
}
