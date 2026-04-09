#!/usr/bin/env node
/**
 * build-verb-maps.cjs
 * -------------------
 * Generates COMPLETE verb form → infinitive maps by running every known
 * infinitive through each language's conjugation engine.
 *
 * For each language:
 *  1. Find all infinitives in the dictionary (by language-specific endings)
 *  2. Strip TypeScript from the conjugation engine and eval it as JS
 *  3. Run every infinitive through conjugate() to get ALL forms
 *  4. Build a map: { conjugatedForm: infinitive }
 *  5. Cross-reference with dictionary: set lemma + pos='v' for matches
 *  6. Write updated dictionary back
 *  7. Report per language
 *
 * Usage: node scripts/build-verb-maps.cjs [--dry-run] [--lang=es,fr,...]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONJ_DIR = path.join(ROOT, 'src/data/conjugation');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');

const DRY_RUN = process.argv.includes('--dry-run');
const langArg = process.argv.find(a => a.startsWith('--lang='));
const ONLY_LANGS = langArg ? langArg.slice(7).split(',') : null;

// ── Language configurations ────────────────────────────────────
const LANG_CONFIGS = {
  es: {
    name: 'Spanish',
    infinitiveEndings: [/ar$/, /er$/, /ir$/],
    // Also try reflexive forms: -arse, -erse, -irse
    extraInfinitiveEndings: [/arse$/, /erse$/, /irse$/],
    conjugateFnName: 'conjugate',
  },
  it: {
    name: 'Italian',
    infinitiveEndings: [/are$/, /ere$/, /ire$/],
    extraInfinitiveEndings: [/arsi$/, /ersi$/, /irsi$/],
    conjugateFnName: 'conjugate',
  },
  fr: {
    name: 'French',
    infinitiveEndings: [/er$/, /ir$/, /re$/, /oir$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
  },
  pt: {
    name: 'Portuguese',
    infinitiveEndings: [/ar$/, /er$/, /ir$/],
    extraInfinitiveEndings: [/ar-se$/, /er-se$/, /ir-se$/],
    conjugateFnName: 'conjugate',
  },
  de: {
    name: 'German',
    infinitiveEndings: [/en$/, /eln$/, /ern$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
    // Filter: require at least 3 chars to avoid matching random "en" words
    minLength: 3,
  },
  nl: {
    name: 'Dutch',
    infinitiveEndings: [/en$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
    minLength: 3,
  },
  sv: {
    name: 'Swedish',
    infinitiveEndings: [/a$/],
    extraInfinitiveEndings: [/as$/],
    conjugateFnName: 'conjugate',
    // Swedish: many non-verb words end in -a, so we only use dict entries with pos='v'
    // or entries that conjugate successfully
    minLength: 2,
    requireVerbPos: true,
  },
  hi: {
    name: 'Hindi',
    infinitiveEndings: [/ना$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugateHindi',
  },
  tr: {
    name: 'Turkish',
    infinitiveEndings: [/mek$/, /mak$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
  },
  ru: {
    name: 'Russian',
    infinitiveEndings: [/ть$/, /ти$/, /чь$/, /ться$/, /тись$/],
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
  },
  cy: {
    name: 'Welsh',
    infinitiveEndings: [], // No consistent ending — use pos='v'
    extraInfinitiveEndings: [],
    conjugateFnName: 'conjugate',
    useVerbPosOnly: true,
  },
};

// ── TypeScript stripping ───────────────────────────────────────
/**
 * Strip TypeScript type annotations, imports, interfaces, and type aliases
 * from source code to produce valid JavaScript that can be eval'd.
 *
 * Strategy: process line-by-line with awareness of balanced angle brackets
 * to handle nested generics like Record<string, Record<TenseKey, Forms>>.
 */
function stripTypeScript(source) {
  let code = source;

  // Remove import statements (including type imports)
  code = code.replace(/^import\s+.*?;?\s*$/gm, '');

  // Remove interface declarations (multi-line with nested braces)
  code = removeInterfaces(code);

  // Remove type alias lines
  code = code.replace(/^type\s+\w+\s*=\s*[^;]+;/gm, '');

  // Remove 'export' keywords
  code = code.replace(/\bexport\s+/g, '');

  // Remove `default` export line
  code = code.replace(/^default\s+\w+;?\s*$/gm, '');

  // Remove non-null assertion operator: expr! → expr
  // Must be careful not to remove ! in !== or !=
  // Match: identifier or ) or ] followed by ! followed by a non-= character
  code = code.replace(/(\w|\)|\])\!(?!=)/g, '$1');

  // Join multi-line function signatures onto a single line
  // This handles cases like:
  //   function foo(
  //     a: string,
  //     b: number,
  //   ): ReturnType {
  code = joinMultiLineSignatures(code);

  // Handle functions with multi-line object return types:
  // function foo(x): {\n  prop: Type;\n} {\n body \n}
  // → function foo(x) {\n body \n}
  code = removeObjectReturnTypes(code);

  // Process line by line for more precise stripping
  const lines = code.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip blank/comment lines
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line) || /^\s*\/?\*/.test(line)) {
      result.push(line);
      continue;
    }

    // Remove 'as Type' casts (including 'as unknown as Type' and generic types)
    // Handle: as unknown as Forms, as Record<TenseKey, Forms>, as Forms, etc.
    line = line.replace(/\s+as\s+unknown\s+as\s+\w+(?:<[^>]+>)?(?:\[\])?/g, '');
    line = line.replace(/\s+as\s+\w+(?:<[^>]+>)?(?:\[\])?/g, '');

    // Remove type annotations on const/let/var declarations
    // e.g., const TENSES: TenseKey[] = → const TENSES =
    // e.g., const REG: Record<string, Record<TenseKey, Forms>> = → const REG =
    line = line.replace(/((?:const|let|var)\s+\w+)\s*:\s*([^=]+?)\s*=/, (match, decl, typeStr) => {
      // Check if typeStr looks like a type annotation (starts with a capital letter,
      // or is a known type keyword, or contains angle brackets)
      const cleanType = typeStr.trim();
      if (/^(?:[A-Z]|Record|Partial|Pick|Set|Map|string|number|boolean|'[^']*')/.test(cleanType) ||
          cleanType.includes('<') || cleanType.includes('|')) {
        return `${decl} =`;
      }
      return match; // Not a type annotation, leave it
    });

    // Remove return type annotations from function declarations
    // function foo(params): ReturnType { → function foo(params) {
    // Also handle object return types: function foo(params): { x: string; } {
    // Strategy: find the last `{` on the line — that's the function body opener
    if (/function\s+\w+\s*\([^)]*\)\s*:/.test(line) && line.includes('{')) {
      // Find position of the last `{` (function body)
      const lastBrace = line.lastIndexOf('{');
      // Find the `)` that ends the params
      const closeParen = line.indexOf(')');
      if (closeParen >= 0 && lastBrace > closeParen) {
        // Everything between `)` and last `{` is the return type annotation
        line = line.substring(0, closeParen + 1) + ' ' + line.substring(lastBrace);
      }
    }

    // Strip parameter type annotations in function declarations
    // function foo(a: string, b: number) → function foo(a, b)
    if (/function\s+\w+\s*\(/.test(line) && /:/.test(line)) {
      line = line.replace(/function\s+(\w+)\s*\(([^)]*)\)/, (match, name, params) => {
        const cleanParams = stripParamTypes(params);
        return `function ${name}(${cleanParams})`;
      });
    }

    // Strip parameter types in arrow functions
    // (a: string, b: number) => → (a, b) =>
    // Also handle (): ReturnType =>
    line = line.replace(/\(([^)]*)\)\s*:\s*[^=]+(?=\s*=>)/, (match, params) => {
      const cleanParams = stripParamTypes(params);
      return `(${cleanParams})`;
    });

    // Handle variable declarations without initializer: let stem: string;
    // → let stem;
    line = line.replace(/((?:let|var)\s+\w+)\s*:\s*(?:string|number|boolean|Forms|Record<[^>]+>|\w+)(?:\[\])?\s*;/g, '$1;');

    // Handle multiple typed declarations: let a: string, b: string, c: string;
    // → let a, b, c;
    line = line.replace(/((?:let|var)\s+)(\w+)\s*:\s*\w+(?:\[\])?\s*,\s*(\w+)\s*:\s*\w+(?:\[\])?\s*,\s*(\w+)\s*:\s*\w+(?:\[\])?\s*;/g,
      '$1$2, $3, $4;');
    // Handle two typed declarations: let a: string, b: string;
    line = line.replace(/((?:let|var)\s+)(\w+)\s*:\s*\w+(?:\[\])?\s*,\s*(\w+)\s*:\s*\w+(?:\[\])?\s*;/g,
      '$1$2, $3;');

    // Handle arrow functions in const declarations more aggressively
    // const f = (s: string): Forms => ... → const f = (s) => ...
    // Match both typed params and return types
    if (line.includes('=>') && line.includes(':')) {
      line = line.replace(/=\s*\(([^)]*)\)\s*(?::\s*[^=]+?)?\s*(=>)/g, (match, params, arrow) => {
        const cleanParams = stripParamTypes(params);
        return `= (${cleanParams}) ${arrow}`;
      });
    }

    // Remove `readonly` keyword
    line = line.replace(/\breadonly\s+/g, '');

    // Remove generic type parameters on function calls: something<Type>(...)
    // But be careful not to remove comparison operators
    // Only remove if followed by ( which indicates a generic call
    line = line.replace(/(\w+)<[^>]+>\(/g, '$1(');

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Remove multi-line object return type annotations from functions.
 * e.g.:
 *   function foo(x: string): {
 *     present: string;
 *     past: string;
 *   } {
 *     // body
 *   }
 * becomes:
 *   function foo(x: string) {
 *     // body
 *   }
 */
function removeObjectReturnTypes(code) {
  const lines = code.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect: function declaration ending with ): { or ): {
    // where the { is the start of a return type object, not the function body
    if (/function\s+\w+\s*\([^)]*\)\s*:\s*\{\s*$/.test(line)) {
      // This line opens a return type object. Find the matching } then {
      let braceDepth = 1;
      let j = i + 1;
      let foundClosing = false;
      while (j < lines.length) {
        const jLine = lines[j];
        // Check if this line contains `} {` — the return type closer + body opener
        if (/^\s*\}\s*\{/.test(jLine) && braceDepth === 1) {
          foundClosing = true;
          break;
        }
        for (const ch of jLine) {
          if (ch === '{') braceDepth++;
          else if (ch === '}') braceDepth--;
        }
        j++;
      }
      if (foundClosing) {
        // Emit the function declaration without the return type, plus the body opener
        const funcLine = line.replace(/\)\s*:\s*\{\s*$/, ') {');
        result.push(funcLine);
        i = j + 1; // Skip past the return type lines and the `} {` line
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

/**
 * Remove interface declarations (potentially multi-line with nested braces).
 */
function removeInterfaces(code) {
  const lines = code.split('\n');
  const result = [];
  let inInterface = false;
  let braceDepth = 0;

  for (const line of lines) {
    if (!inInterface && /^\s*interface\s+\w+/.test(line)) {
      inInterface = true;
      braceDepth = 0;
      // Count braces on this line
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) inInterface = false;
      continue; // skip interface line
    }

    if (inInterface) {
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) inInterface = false;
      continue; // skip interface content
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Join multi-line function/arrow signatures onto a single line.
 * Detects `function name(` where `)` is not on the same line,
 * and joins lines until the closing `)` and opening `{` are found.
 */
function joinMultiLineSignatures(code) {
  const lines = code.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this line starts a function declaration with open paren but no close
    if (/(?:function\s+\w+|=>\s*function)\s*\([^)]*$/.test(line) ||
        /(?:const|let|var)\s+\w+\s*=\s*\([^)]*$/.test(line)) {
      // Accumulate lines until we find the closing paren and opening brace
      let combined = line;
      let parenDepth = 0;
      for (const ch of line) {
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
      }

      while (parenDepth > 0 && i + 1 < lines.length) {
        i++;
        combined += ' ' + lines[i].trim();
        for (const ch of lines[i]) {
          if (ch === '(') parenDepth++;
          else if (ch === ')') parenDepth--;
        }
      }

      // If the closing paren is followed by `: ReturnType {` on next line, grab that too
      if (i + 1 < lines.length && /^\s*(?::\s*\S)/.test(lines[i + 1])) {
        i++;
        combined += ' ' + lines[i].trim();
      }
      // Also check if `{` is on next line
      if (i + 1 < lines.length && /^\s*\{/.test(lines[i + 1])) {
        i++;
        combined += ' ' + lines[i].trim();
      }

      result.push(combined);
    } else {
      result.push(line);
    }
    i++;
  }

  return result.join('\n');
}

/**
 * Split parameters respecting angle bracket nesting.
 * `a: string, b: Record<string, Forms>` → ['a: string', 'b: Record<string, Forms>']
 */
function splitParams(params) {
  const result = [];
  let current = '';
  let angleBracketDepth = 0;
  let parenDepth = 0;
  let squareBracketDepth = 0;

  for (const ch of params) {
    if (ch === '<') angleBracketDepth++;
    else if (ch === '>') angleBracketDepth--;
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === '[') squareBracketDepth++;
    else if (ch === ']') squareBracketDepth--;
    else if (ch === ',' && angleBracketDepth === 0 && parenDepth === 0 && squareBracketDepth === 0) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current);
  return result;
}

function stripParamTypes(params) {
  return splitParams(params).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // Handle rest params: ...overrides: PartialTenses[] → ...overrides
    if (trimmed.startsWith('...')) {
      const name = trimmed.match(/^\.\.\.(\w+)/);
      return name ? `...${name[1]}` : trimmed;
    }
    // Handle default values: name: Type = default → name = default
    const defaultMatch = trimmed.match(/^(\w+)\s*\??\s*:\s*[^=]+=\s*(.+)$/);
    if (defaultMatch) return `${defaultMatch[1]} = ${defaultMatch[2]}`;
    // Handle tuple types: name: [string, string] → name
    if (/^(\w+)\s*\??\s*:\s*\[/.test(trimmed)) {
      return trimmed.match(/^(\w+)/)[1];
    }
    // Handle optional params: name?: Type → name
    const optMatch = trimmed.match(/^(\w+)\s*\??\s*:\s*.+$/);
    if (optMatch) return optMatch[1];
    // Destructured params or rest params — leave as-is
    return trimmed.replace(/:\s*\w+(\[\])?$/, '');
  }).join(', ');
}

// ── Load conjugation engine ────────────────────────────────────
function loadConjugationEngine(lang, fnName) {
  const filePath = path.join(CONJ_DIR, `${lang}.ts`);
  let source = fs.readFileSync(filePath, 'utf-8');

  // Strip TypeScript
  let code = stripTypeScript(source);

  // Debug: write stripped code to /tmp for inspection
  if (process.argv.includes('--debug')) {
    fs.writeFileSync(`/tmp/${lang}-stripped.js`, code);
    console.log(`  Debug: wrote stripped code to /tmp/${lang}-stripped.js`);
  }

  // Wrap in a function that returns the conjugate function
  const wrapped = `
    (function() {
      ${code}
      return { ${fnName}: ${fnName} };
    })()
  `;

  try {
    const result = eval(wrapped);
    if (typeof result[fnName] !== 'function') {
      throw new Error(`${fnName} is not a function in ${lang} conjugation engine`);
    }
    return result[fnName];
  } catch (e) {
    console.error(`  ERROR loading ${lang} conjugation engine: ${e.message}`);
    // Try to show the problematic area
    if (e instanceof SyntaxError && e.stack) {
      const lineMatch = e.stack.match(/<anonymous>:(\d+)/);
      if (lineMatch) {
        const lineNo = parseInt(lineMatch[1]);
        const lines = wrapped.split('\n');
        console.error(`  Near line ${lineNo}:`);
        for (let i = Math.max(0, lineNo - 3); i < Math.min(lines.length, lineNo + 3); i++) {
          console.error(`    ${i + 1}: ${lines[i]}`);
        }
      }
    }
    return null;
  }
}

// ── Load dictionary ────────────────────────────────────────────
function loadDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const source = fs.readFileSync(filePath, 'utf-8');

  // Extract the dictionary object
  // The format is: export const dictionary: Record<string, DictEntry> = { ... };
  // We need to parse this carefully because it's a large object

  // Find the start of the dictionary object
  // Handle different variable names: dictionary, DICT, dict
  const dictMatch = source.match(/(?:export\s+)?const\s+(?:dictionary|DICT|dict)\s*(?::\s*Record<[^>]+>)?\s*=\s*\{/);
  if (!dictMatch) {
    console.error(`  Could not find dictionary in ${lang}.ts`);
    return { entries: {}, source, dictStart: -1, dictEnd: -1 };
  }

  const dictStartIdx = dictMatch.index + dictMatch[0].length - 1; // position of opening {

  // Find matching closing brace
  let depth = 1;
  let i = dictStartIdx + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  const dictEndIdx = i; // position after closing }

  const dictContent = source.substring(dictStartIdx, dictEndIdx);

  // Parse the dictionary entries using a regex approach
  // Each entry looks like: 'word': { en: '...', ipa: '...', pos: '...', lemma: '...' },
  // or "word": { ... }
  const entries = {};
  const entryRegex = /(?:'([^']+)'|"([^"]+)")\s*:\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(dictContent)) !== null) {
    const key = m[1] || m[2];
    const propsStr = m[3];

    const entry = {};
    // Parse individual properties
    const enMatch = propsStr.match(/en\s*:\s*(?:'([^']*(?:\\'[^']*)*)'|"([^"]*(?:\\"[^"]*)*)")/);
    if (enMatch) entry.en = enMatch[1] || enMatch[2];

    const ipaMatch = propsStr.match(/ipa\s*:\s*(?:'([^']*(?:\\'[^']*)*)'|"([^"]*(?:\\"[^"]*)*)")/);
    if (ipaMatch) entry.ipa = ipaMatch[1] || ipaMatch[2];

    const posMatch = propsStr.match(/pos\s*:\s*'([^']*)'/);
    if (posMatch) entry.pos = posMatch[1];

    const lemmaMatch = propsStr.match(/lemma\s*:\s*'([^']*)'/);
    if (lemmaMatch) entry.lemma = lemmaMatch[1];

    entries[key] = entry;
  }

  return { entries, source, dictStart: dictStartIdx, dictEnd: dictEndIdx };
}

// ── Extract individual words from conjugated form ──────────────
/**
 * A conjugated form might be a phrase like "me suis lavé" or "буду читать".
 * We extract individual words that could appear in the dictionary.
 */
function extractWords(form) {
  if (!form || form === '-' || form === '—') return [];

  // Split on spaces and slash
  const words = form.split(/[\s\/]+/).filter(w => w.length > 0 && w !== '-' && w !== '—');
  return words;
}

// ── Build verb form map for a language ─────────────────────────
function buildVerbMap(lang, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing ${config.name} (${lang})`);
  console.log('='.repeat(60));

  // Load conjugation engine
  const conjugate = loadConjugationEngine(lang, config.conjugateFnName);
  if (!conjugate) {
    console.log(`  SKIPPED: Could not load conjugation engine`);
    return null;
  }

  // Load dictionary
  const { entries, source, dictStart, dictEnd } = loadDictionary(lang);
  const dictKeys = Object.keys(entries);
  console.log(`  Dictionary: ${dictKeys.length} entries`);

  // Find all infinitives from dictionary
  const infinitives = new Set();

  for (const key of dictKeys) {
    const entry = entries[key];
    const word = key.toLowerCase();

    // Check if this word looks like an infinitive
    let isInfinitive = false;

    if (config.useVerbPosOnly) {
      // Welsh: use pos='v' entries as "infinitives" (verbal nouns)
      if (entry.pos === 'v') {
        isInfinitive = true;
      }
    } else if (config.requireVerbPos) {
      // Swedish: many -a words are not verbs; require pos='v' OR successful conjugation
      if (entry.pos === 'v') {
        isInfinitive = true;
      } else {
        for (const re of config.infinitiveEndings) {
          if (re.test(word) && (!config.minLength || word.length >= config.minLength)) {
            // Try conjugating — if it works, it's likely a verb
            const result = conjugate(word);
            if (result) {
              isInfinitive = true;
              break;
            }
          }
        }
      }
    } else {
      for (const re of config.infinitiveEndings) {
        if (re.test(word) && (!config.minLength || word.length >= config.minLength)) {
          isInfinitive = true;
          break;
        }
      }
      if (!isInfinitive && config.extraInfinitiveEndings) {
        for (const re of config.extraInfinitiveEndings) {
          if (re.test(word)) {
            isInfinitive = true;
            break;
          }
        }
      }
    }

    if (isInfinitive) {
      infinitives.add(word);
    }

    // Also add entries that already have pos='v' even if ending doesn't match
    if (entry.pos === 'v' && !isInfinitive) {
      infinitives.add(word);
    }
  }

  // For German: also try "to X" → X pattern from English translations
  // (some verbs like "tun" don't end in -en)
  if (lang === 'de' && !infinitives.has('tun')) {
    infinitives.add('tun');
  }

  console.log(`  Infinitives found: ${infinitives.size}`);

  // Run each infinitive through the conjugation engine
  const verbFormMap = new Map(); // form → infinitive
  let totalForms = 0;
  let successfulConjugations = 0;
  let failedConjugations = 0;

  for (const inf of infinitives) {
    let result;
    try {
      result = conjugate(inf);
    } catch (e) {
      // Some words might not be real verbs
      failedConjugations++;
      continue;
    }

    if (!result || !result.tenses) {
      failedConjugations++;
      continue;
    }

    successfulConjugations++;

    // Add the infinitive itself
    if (!verbFormMap.has(inf)) {
      verbFormMap.set(inf, inf);
    }

    // Extract all conjugated forms
    for (const [tenseName, forms] of Object.entries(result.tenses)) {
      if (!Array.isArray(forms)) continue;
      for (const form of forms) {
        const words = extractWords(form);
        for (const word of words) {
          const lower = word.toLowerCase().replace(/[.,!?;:"""''()—–\-]/g, '');
          if (lower.length < 2) continue;

          // Don't map auxiliary/helper words to this verb
          if (isCommonAuxiliary(lang, lower)) continue;

          // Don't overwrite: first infinitive wins (more common verbs processed first)
          if (!verbFormMap.has(lower)) {
            verbFormMap.set(lower, inf);
            totalForms++;
          }
        }
      }
    }
  }

  console.log(`  Conjugations: ${successfulConjugations} successful, ${failedConjugations} failed`);
  console.log(`  Verb forms mapped: ${totalForms}`);

  // Add language-specific extra patterns
  addExtraPatterns(lang, infinitives, verbFormMap, entries);

  console.log(`  Verb forms after extras: ${verbFormMap.size}`);

  // Cross-reference with dictionary
  let updatedCount = 0;
  const updates = [];

  for (const [key, entry] of Object.entries(entries)) {
    const lower = key.toLowerCase();

    if (verbFormMap.has(lower)) {
      const infinitive = verbFormMap.get(lower);

      // Don't set lemma to self (that's redundant)
      if (lower === infinitive) {
        // Set pos='v' if not already set and no other pos assigned
        if (!entry.pos) {
          updates.push({ key, field: 'pos', value: 'v' });
          updatedCount++;
        }
        continue;
      }

      let changed = false;

      // Only update if entry doesn't already have a non-verb pos
      // (avoid marking nouns/adjectives as verbs just because they match a form)
      if (entry.pos && entry.pos !== 'v') {
        continue; // Already has a non-verb POS, skip
      }

      // Set lemma if not already set
      if (!entry.lemma) {
        updates.push({ key, field: 'lemma', value: infinitive });
        changed = true;
      }

      // Set pos to 'v' if not already set
      if (!entry.pos) {
        updates.push({ key, field: 'pos', value: 'v' });
        changed = true;
      }

      if (changed) updatedCount++;
    }
  }

  console.log(`  Dictionary entries to update: ${updatedCount}`);

  // Apply updates to the source file
  if (updatedCount > 0 && !DRY_RUN) {
    const newSource = applyDictionaryUpdates(source, updates, entries);
    const filePath = path.join(DICT_DIR, `${lang}.ts`);
    fs.writeFileSync(filePath, newSource, 'utf-8');
    console.log(`  Written updated dictionary to ${filePath}`);
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] Would update ${updatedCount} entries`);
    // Show a sample of updates
    const sample = updates.slice(0, 10);
    for (const u of sample) {
      console.log(`    ${u.key}: ${u.field} = '${u.value}'`);
    }
    if (updates.length > 10) {
      console.log(`    ... and ${updates.length - 10} more`);
    }
  }

  return {
    lang,
    name: config.name,
    dictEntries: dictKeys.length,
    infinitives: infinitives.size,
    successfulConjugations,
    failedConjugations,
    totalForms: verbFormMap.size,
    updatedEntries: updatedCount,
  };
}

// ── Common auxiliary words to exclude from verb maps ────────────
function isCommonAuxiliary(lang, word) {
  const auxiliaries = {
    es: new Set(['me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las']),
    it: new Set(['mi', 'ti', 'si', 'ci', 'vi']),
    fr: new Set(['me', 'te', 'se', 'nous', 'vous', 'ai', 'as', 'a', 'ont', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont',
                 "m'", "t'", "s'", 'je', 'tu', 'il', 'elle', 'on', 'ils', 'elles']),
    pt: new Set(['me', 'te', 'se', 'nos', 'vos']),
    de: new Set(['mich', 'dich', 'sich', 'uns', 'euch',
                 'habe', 'hast', 'hat', 'haben', 'habt',
                 'bin', 'bist', 'ist', 'sind', 'seid',
                 'werde', 'wirst', 'wird', 'werden', 'werdet',
                 'würde', 'würdest', 'würden', 'würdet']),
    nl: new Set(['heb', 'hebt', 'heeft', 'hebben',
                 'ben', 'bent', 'is', 'zijn', 'zal', 'zult', 'zullen',
                 'zou', 'zouden']),
    sv: new Set(['har', 'hade', 'ska', 'skulle', 'är', 'var']),
    hi: new Set(['हूँ', 'है', 'हैं', 'हो', 'था', 'थी', 'थे', 'थीं']),
    tr: new Set([]),
    ru: new Set(['буду', 'будешь', 'будет', 'будем', 'будете', 'будут', 'бы',
                 'давайте']),
    cy: new Set(["rwy'n", "rwyt", "mae", "rydyn", "rydych", "maen",
                 "roeddwn", "roeddet", "roedd", "roedden", "roeddech",
                 "bydda", "byddi", "bydd", "byddwn", "byddwch", "byddan",
                 "baswn", "baset", "basai", "basen", "basech",
                 "gwnes", "gwnest", "gwnaeth", "gwnaethon", "gwnaethoch",
                 "i", "ti", "ni", "chi", "nhw", "e/hi", "fe/hi", "di",
                 "yn", "'n"]),
  };
  return auxiliaries[lang]?.has(word) || false;
}

// ── Language-specific extra patterns ───────────────────────────
function addExtraPatterns(lang, infinitives, verbFormMap, entries) {
  let extraCount = 0;

  if (lang === 'hi') {
    // Hindi: stem + कर (conjunctive participle), stem + ने (oblique infinitive)
    // stem + ना (infinitive already covered), stem + ने (oblique)
    for (const inf of infinitives) {
      if (!inf.endsWith('ना')) continue;
      const stem = inf.slice(0, -2);
      // Conjunctive participle: stem + कर or stem + के
      const conjPart = stem + 'कर';
      if (!verbFormMap.has(conjPart)) { verbFormMap.set(conjPart, inf); extraCount++; }
      const conjPartKe = stem + 'के';
      if (!verbFormMap.has(conjPartKe)) { verbFormMap.set(conjPartKe, inf); extraCount++; }
      // Oblique infinitive: stem + ने
      const oblique = stem + 'ने';
      if (!verbFormMap.has(oblique)) { verbFormMap.set(oblique, inf); extraCount++; }
      // Feminine forms: stem + ती, stem + रही
      const femHab = stem + 'ती';
      if (!verbFormMap.has(femHab)) { verbFormMap.set(femHab, inf); extraCount++; }
      const femCont = stem + ' रही';
      if (!verbFormMap.has(femCont)) { verbFormMap.set(femCont, inf); extraCount++; }
      // Past feminine: stem + ी
      const pastFem = stem + 'ी';
      if (!verbFormMap.has(pastFem)) { verbFormMap.set(pastFem, inf); extraCount++; }
      // Feminine future: stem + ऊँगी, एगी, एँगी, ओगी
      for (const suffix of ['ऊँगी', 'एगी', 'एँगी', 'ओगी']) {
        const form = stem + suffix;
        if (!verbFormMap.has(form)) { verbFormMap.set(form, inf); extraCount++; }
      }
    }
  }

  if (lang === 'de') {
    // German: ge-X-t and ge-X-en past participles for verbs not in irregular table
    // Also: separable prefix past participles like auf-ge-macht
    for (const inf of infinitives) {
      const stem = inf.endsWith('en') ? inf.slice(0, -2)
                 : inf.endsWith('eln') || inf.endsWith('ern') ? inf.slice(0, -1)
                 : inf.endsWith('n') ? inf.slice(0, -1)
                 : inf;

      // Regular past participle: ge + stem + t/et
      const needsE = /[td]$/.test(stem) || /[^lrmnhaeiouäöü][mn]$/.test(stem);
      const pp = 'ge' + stem + (needsE ? 'et' : 't');
      if (!verbFormMap.has(pp)) { verbFormMap.set(pp, inf); extraCount++; }

      // Strong past participle guess: ge + stem + en
      const ppStrong = 'ge' + stem + 'en';
      if (!verbFormMap.has(ppStrong)) { verbFormMap.set(ppStrong, inf); extraCount++; }
    }
  }

  if (lang === 'ru') {
    // Russian: perfective prefix variations
    // Add reflexive variants: if we have "читать", also map "читаться" forms
    for (const inf of infinitives) {
      if (inf.endsWith('ться') || inf.endsWith('ся')) continue;
      // Create reflexive infinitive and try it
      if (inf.endsWith('ть')) {
        const reflInf = inf.slice(0, -2) + 'ться';
        if (!verbFormMap.has(reflInf)) { verbFormMap.set(reflInf, inf); extraCount++; }
      }
    }
  }

  if (lang === 'cy') {
    // Welsh: soft mutation forms
    // Many Welsh verb forms undergo consonant mutations
    const mutations = {
      'p': 'b', 'b': 'f', 't': 'd', 'd': 'dd', 'c': 'g', 'g': '',
      'm': 'f', 'rh': 'r', 'll': 'l',
    };

    for (const inf of infinitives) {
      for (const [from, to] of Object.entries(mutations)) {
        if (inf.startsWith(from)) {
          const mutated = to + inf.slice(from.length);
          if (mutated.length > 1 && !verbFormMap.has(mutated)) {
            verbFormMap.set(mutated, inf);
            extraCount++;
          }
        }
      }
    }
  }

  if (extraCount > 0) {
    console.log(`  Added ${extraCount} extra pattern forms`);
  }
}

// ── Apply dictionary updates ───────────────────────────────────
function applyDictionaryUpdates(source, updates, entries) {
  if (updates.length === 0) return source;

  let result = source;

  // Group updates by key
  const updatesByKey = {};
  for (const u of updates) {
    if (!updatesByKey[u.key]) updatesByKey[u.key] = [];
    updatesByKey[u.key].push(u);
  }

  // Process each key
  for (const [key, keyUpdates] of Object.entries(updatesByKey)) {
    const entry = entries[key];

    // Find the entry in the source
    // Handle both single-quoted and double-quoted keys
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryRegex = new RegExp(
      `((?:'${escapedKey}'|"${escapedKey}")\\s*:\\s*\\{)([^}]+)(\\})`,
      'g'
    );

    result = result.replace(entryRegex, (match, prefix, propsStr, suffix) => {
      let newProps = propsStr;

      for (const update of keyUpdates) {
        if (update.field === 'lemma') {
          // Add or update lemma
          if (/lemma\s*:/.test(newProps)) {
            // Update existing
            newProps = newProps.replace(/lemma\s*:\s*'[^']*'/, `lemma: '${update.value}'`);
          } else {
            // Add lemma before the closing brace
            // Find the last property and add after it
            newProps = newProps.replace(/(\s*)$/, `, lemma: '${update.value}'$1`);
          }
        }
        if (update.field === 'pos') {
          if (/pos\s*:/.test(newProps)) {
            // Update existing
            newProps = newProps.replace(/pos\s*:\s*'[^']*'/, `pos: '${update.value}'`);
          } else {
            // Add pos
            newProps = newProps.replace(/(\s*)$/, `, pos: '${update.value}'$1`);
          }
        }
      }

      return prefix + newProps + suffix;
    });
  }

  return result;
}

// ── Main ───────────────────────────────────────────────────────
function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          BUILD VERB MAPS — Verb Form → Infinitive       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  if (DRY_RUN) console.log('\n  [DRY RUN MODE — no files will be modified]');

  const results = [];

  for (const [lang, config] of Object.entries(LANG_CONFIGS)) {
    if (ONLY_LANGS && !ONLY_LANGS.includes(lang)) continue;

    try {
      const result = buildVerbMap(lang, config);
      if (result) results.push(result);
    } catch (e) {
      console.error(`\n  FATAL ERROR processing ${lang}: ${e.message}`);
      console.error(e.stack);
    }
  }

  // Summary report
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`${'Lang'.padEnd(6)} ${'Name'.padEnd(12)} ${'Dict'.padStart(6)} ${'Infin'.padStart(6)} ${'Conj'.padStart(6)} ${'Forms'.padStart(7)} ${'Updated'.padStart(8)}`);
  console.log('-'.repeat(60));

  let totalUpdated = 0;
  for (const r of results) {
    console.log(
      `${r.lang.padEnd(6)} ${r.name.padEnd(12)} ${String(r.dictEntries).padStart(6)} ` +
      `${String(r.infinitives).padStart(6)} ${String(r.successfulConjugations).padStart(6)} ` +
      `${String(r.totalForms).padStart(7)} ${String(r.updatedEntries).padStart(8)}`
    );
    totalUpdated += r.updatedEntries;
  }
  console.log('-'.repeat(60));
  console.log(`Total entries updated: ${totalUpdated}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No files were modified. Remove --dry-run to apply changes.');
  }
}

main();
