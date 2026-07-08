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
  /** The root — Indonesian's equivalent of the dictionary form. */
  infinitive: string;
  isReflexive: boolean; // no reflexive category in Indonesian; always false
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
  'ada', 'boleh', 'belok', 'jumpa', 'lewat', 'terbit', 'minta', 'turun', 'kembali', 'numpang', 'baik', 'diam',
  // wave-3 roots
  'aju', 'alam', 'alas', 'aman', 'antre', 'asal', 'atur', 'bagi', 'bahagia', 'baik', 'beda', 'berangkat', 'beres', 'besar', 'biasa', 'bimbing', 'buang', 'bungkus', 'capai', 'catat', 'celaka', 'cepat', 'cetak', 'cium', 'curi', 'daftar', 'dagang', 'darat', 'dingin', 'ganggu', 'gilir', 'goreng', 'habis', 'hadir', 'hangat', 'hias', 'hibur', 'hitung', 'kata', 'kebun', 'kejar', 'kejut', 'keliling', 'kemudi', 'kering', 'ketuk', 'kosong', 'kuliah', 'kurang', 'lahir', 'lamar', 'lampir', 'lanjut', 'lapor', 'layan', 'lebih', 'lelah', 'lembur', 'luka', 'lukis', 'lulus', 'macet', 'maju', 'menang', 'milik', 'mohon', 'muat', 'mudik', 'mundur', 'nikmat', 'obrol', 'pajang', 'paksa', 'pamer', 'pamit', 'panas', 'pandang', 'pandu', 'panjang', 'pasar', 'pecah', 'percaya', 'pimpin', 'potong', 'puji', 'putar', 'putus', 'ramai', 'rapi', 'repot', 'rindu', 'saji', 'salah', 'sambut', 'sampai', 'saran', 'sayur', 'sebar', 'seberang', 'sehat', 'sempat', 'senang', 'sentuh', 'serah', 'setir', 'setrika', 'setuju', 'sewa', 'siram', 'sulit', 'sumbang', 'suruh', 'susun', 'tabung', 'tandatangan', 'tanding', 'tangkap', 'tani', 'tarik', 'teman', 'tempuh', 'teriak', 'tetes', 'timbang', 'titip', 'tolak', 'traktir', 'transfer', 'tugas', 'tuju', 'tumpang', 'tumpuk', 'tunang', 'tunjuk', 'turut', 'ucap', 'ukur', 'ulang', 'umum', 'undur', 'usaha',
  // wave-4 roots
  'ungkep', 'resap', 'pedas',
  'absen', 'aduk', 'akhir', 'aneh', 'anggap', 'arti', 'asin', 'bangga', 'benci', 'berhasil', 'betah', 'bosan', 'cabut', 'campur', 'canggung', 'cas', 'cemar', 'darah', 'daur', 'denda', 'doyan', 'dukung', 'gagal', 'geprek', 'gerak', 'geser', 'gigit', 'goda', 'gonggong', 'gugup', 'hapus', 'harga', 'haru', 'hemat', 'indah', 'jahit', 'jebak', 'jelang', 'jujur', 'kaget', 'kagum', 'kalah', 'kecewa', 'kecil', 'kelok', 'kemas', 'kembang', 'kena', 'kendara', 'ketik', 'khawatir', 'kira', 'kokok', 'kukus', 'larang', 'lega', 'lempem', 'lepas', 'libat', 'lipat', 'lomba', 'luap', 'luncur', 'malu', 'nyaman', 'oles', 'padam', 'panen', 'peduli', 'pegang', 'pelihara', 'pendam', 'peras', 'pisah', 'puas', 'pulih', 'pungut', 'ragu', 'rantau', 'rebus', 'rebut', 'reda', 'rokok', 'rusak', 'sabar', 'sadar', 'salin', 'sambung', 'sanggup', 'sebut', 'sedia', 'sedih', 'segar', 'sejuk', 'semangat', 'sembunyi', 'sepi', 'sesat', 'siang', 'suap', 'tagih', 'tahan', 'takut', 'tambah', 'tampung', 'tawa', 'tebang', 'tenang', 'tengkar', 'tengok', 'tentu', 'terjun', 'tumbang', 'tumbuh', 'tumis', 'ulas', 'ulek', 'unduh', 'unggah', 'urus', 'usir', 'usul', 'yakin',
  // batch-2 roots
  'begadang',
  'bakar', 'bunyi',
  'ajak', 'bahas', 'balas', 'batal', 'batuk', 'belanja', 'beri', 'bersih', 'bilang', 'cat', 'cek', 'cerita', 'cicip', 'daki', 'doa', 'foto', 'gambar', 'gantung', 'hadap', 'hilang', 'hubung', 'hujan', 'ikut', 'inap', 'isi', 'istirahat', 'jadi', 'jaga', 'janji', 'jatuh', 'jelas', 'jemur', 'kabar', 'kunci', 'kunjung', 'laku', 'latih', 'libur', 'mampir', 'muncul', 'nyala', 'nyanyi', 'olahraga', 'pancing', 'panggil', 'pasang', 'periksa', 'pilih', 'pindah', 'pinjam', 'potret', 'rawat', 'raya', 'renang', 'sepeda', 'siap', 'sikat', 'simpan', 'sumbat', 'tanam', 'tangis', 'tari', 'taruh', 'teduh', 'telan', 'telepon', 'terbang', 'tiup', 'tukar', 'tunda', 'undang',
]);

const VOWELS = 'aiueo';

/** Loanword roots keep their onset after meN- (mentraktir, mentransfer). */
const MEN_OVERRIDES: Record<string, string> = {
  traktir: 'mentraktir',
  transfer: 'mentransfer',
};

/** Apply meN- to a root with standard assimilation. */
export function applyMeN(root: string): string {
  if (!root) return root;
  if (MEN_OVERRIDES[root]) return MEN_OVERRIDES[root];
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
  baik: ['perbaiki', 'memperbaiki', 'diperbaiki'], // "to fix" — per-…-i class
  panjang: ['perpanjang', 'memperpanjang', 'diperpanjang'], // extend (visa, contract)
  timbang: ['pertimbangkan', 'mempertimbangkan', 'dipertimbangkan'], // consider
};

/** Lexicalized ke-(-an) forms — only real words get a row (kehujanan is
 *  "caught in the rain", ketemu is colloquial "meet"). */
const KE_FORMS: Record<string, string[]> = {
  hujan: ['kehujanan'],
  panas: ['kepanasan'],
  dingin: ['kedinginan'],
  temu: ['ketemu'],
  tinggal: ['ketinggalan'],
  lihat: ['kelihatan'], // "visible; looks (like)"
  pedas: ['kepedasan'], // overwhelmed by spice
};

/** Lexicalized ber-…-an habituals/reciprocals worth a row. */
const BER_AN: Record<string, string> = {
  jual: 'berjualan',   // to sell (as one's trade)
  tunang: 'bertunangan', // to be engaged
  pergi: 'bepergian',  // to travel/be away
  dapat: 'berpendapat', // to hold an opinion (ber+peN+dapat)
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
    'ter- (Stative)': [root.startsWith('r') ? 'te' + root : 'ter' + root],
    'ber- (Middle)': BER_AN[root] ? [applyBer(root), BER_AN[root]] : [applyBer(root)],
    '-kan (Causative)': [root + 'kan', meN + 'kan', 'di' + root + 'kan'],
    '-i (Locative)': [root + 'i', meN + 'i', 'di' + root + 'i'],
  };
  if (PER_KAN[root]) tenses['per- (Causative)'] = PER_KAN[root];
  if (KE_FORMS[root]) tenses['ke- (Lexicalized)'] = KE_FORMS[root];
  // Object clitic -nya attaches to active forms: membacanya "reads it",
  // menghabiskannya "finishes it", mengunjunginya "visits it/them"
  tenses['-nya (+ object)'] = [`${root}nya`, `${meN}nya`, `${meN}kannya`, `${meN}inya`];
  // -lah softens imperatives/invitations: mampirlah "do drop by"
  tenses['-lah (Softener)'] = [`${root}lah`];
  // Reduplication: iterative (jalan-jalan "stroll") and root-meN reciprocal
  // (tawar-menawar "bargaining", jual-menjual "trading")
  tenses['Reduplikasi (Iterative)'] = [`${root}-${root}`, `${root}-${meN}`, `${meN}-${root}`];
  // Colloquial nge- active on short roots (ngecas "to charge", ngecat)
  const syl = root.split('').filter(c => VOWELS.includes(c)).length;
  if (syl <= 1) tenses['nge- (Colloquial)'] = [`nge${root}`];
  return { infinitive: root, isReflexive: false, tenses };
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

  // Reduplication: jalan-jalan → jalan
  const redup = w.match(/^([a-z]+)-\1$/);
  if (redup && KNOWN_ROOTS.has(redup[1])) return redup[1];

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
