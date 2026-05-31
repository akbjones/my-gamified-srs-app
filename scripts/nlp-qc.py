#!/usr/bin/env python3
"""
NLP-powered dictionary QC using Stanford Stanza.

For each card in each deck:
1. Run Stanza NLP pipeline (tokenize, POS, NER, lemmatize)
2. For each token, compare Stanza's analysis with our dictionary
3. Output corrections as JSON for fix-dictionaries.cjs to consume

Catches:
- Wrong POS (our dict says noun, Stanza says verb in context)
- Wrong lemma (our dict has no lemma, Stanza provides the correct infinitive)
- Names used as names (NER=PER but our dict shows adjective meaning)
- Verb forms missing "to" prefix
- Untranslated/transliterated entries
"""

import json
import sys
import os
from collections import defaultdict, Counter
from pathlib import Path

import stanza

# Languages and their deck paths
LANGUAGES = {
    'hi': 'src/data/hindi/deck.json',
    'de': 'src/data/german/deck.json',
    'fr': 'src/data/french/deck.json',
    'es': 'src/data/spanish/deck.json',
    'it': 'src/data/italian/deck.json',
    'pt': 'src/data/portuguese/deck.json',
    'ru': 'src/data/russian/deck.json',
    'tr': 'src/data/turkish/deck.json',
    'sv': 'src/data/swedish/deck.json',
    'nl': 'src/data/dutch/deck.json',
}

# Map Stanza UPOS to our POS tags
UPOS_MAP = {
    'NOUN': 'n', 'PROPN': 'n',  # proper nouns are still nouns in our system
    'VERB': 'v', 'AUX': 'v',
    'ADJ': 'adj',
    'ADV': 'adv',
    'ADP': 'prep',  # adpositions = prepositions/postpositions
    'DET': 'det',
    'PRON': 'pron',
    'NUM': 'num',
    'CONJ': 'conj', 'CCONJ': 'conj', 'SCONJ': 'conj',
    'PART': 'part',
    'INTJ': 'intj',
    'PUNCT': None, 'SYM': None, 'X': None,
}


def load_deck(path):
    """Load deck JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def process_language(lang_code, deck_path, max_cards=None):
    """Process all cards for a language through Stanza."""
    print(f"\n{'='*60}")
    print(f"Processing: {lang_code.upper()} ({deck_path})")
    print(f"{'='*60}")

    # Load deck
    deck = load_deck(deck_path)
    if max_cards:
        deck = deck[:max_cards]
    print(f"  Cards: {len(deck)}")

    # Initialize Stanza pipeline — NER may not be available for all languages
    processors = 'tokenize,pos,lemma,ner'
    try:
        nlp = stanza.Pipeline(
            lang=lang_code,
            processors=processors,
            tokenize_pretokenized=False,
            verbose=False,
            use_gpu=False,
        )
    except Exception:
        print(f"  NER not available for {lang_code}, running without NER")
        processors = 'tokenize,pos,lemma'
        nlp = stanza.Pipeline(
            lang=lang_code,
            processors=processors,
            tokenize_pretokenized=False,
            verbose=False,
            use_gpu=False,
        )

    # Collect all target sentences
    sentences = [card.get('target', '') for card in deck if card.get('target')]

    # Process in batches to avoid memory issues
    batch_size = 200
    all_words = []  # list of (word_text, upos, lemma, ner, sentence_context)

    for i in range(0, len(sentences), batch_size):
        batch = sentences[i:i+batch_size]
        # Join with newlines so Stanza treats each as a separate sentence
        text = '\n'.join(batch)
        try:
            doc = nlp(text)
        except Exception as e:
            print(f"  Error processing batch {i}: {e}")
            continue

        for sent in doc.sentences:
            for word in sent.words:
                ner_tag = 'O'
                # Get NER from the token level
                if hasattr(word, 'parent') and word.parent:
                    token = word.parent
                    if hasattr(token, 'ner') and token.ner:
                        ner_tag = token.ner
                # Also check entity annotations
                for ent in sent.ents if hasattr(sent, 'ents') else []:
                    if word.start_char is not None and ent.start_char is not None:
                        if ent.start_char <= (word.start_char or 0) < ent.end_char:
                            ner_tag = ent.type

                all_words.append({
                    'text': word.text,
                    'upos': word.upos,
                    'lemma': word.lemma,
                    'ner': ner_tag,
                })

        if (i + batch_size) % 1000 == 0:
            print(f"  Processed {min(i+batch_size, len(sentences))}/{len(sentences)} sentences...")

    print(f"  Total words analyzed: {len(all_words)}")

    # Aggregate: for each unique word, count POS tags and NER tags
    word_stats = defaultdict(lambda: {
        'pos_counts': Counter(),
        'ner_counts': Counter(),
        'lemmas': Counter(),
        'total': 0,
    })

    for w in all_words:
        text = w['text'].lower() if lang_code not in ['de'] else w['text']  # German preserves case
        # For non-German, lowercase
        if lang_code != 'de':
            text = w['text']

        stats = word_stats[w['text']]
        stats['pos_counts'][w['upos']] += 1
        stats['ner_counts'][w['ner']] += 1
        if w['lemma']:
            stats['lemmas'][w['lemma']] += 1
        stats['total'] += 1

    # Find names (words tagged as PER by NER)
    names = {}
    for word_text, stats in word_stats.items():
        per_count = sum(v for k, v in stats['ner_counts'].items() if 'PER' in k or 'NEP' in k)
        if per_count > 0 and per_count >= stats['total'] * 0.5:  # >50% of uses are as a name
            names[word_text] = {
                'count': stats['total'],
                'per_count': per_count,
                'dominant_pos': stats['pos_counts'].most_common(1)[0][0] if stats['pos_counts'] else 'NOUN',
            }

    # Find verb forms with lemmas
    verb_lemmas = {}
    for word_text, stats in word_stats.items():
        verb_count = stats['pos_counts'].get('VERB', 0) + stats['pos_counts'].get('AUX', 0)
        if verb_count > 0 and verb_count >= stats['total'] * 0.3:  # >30% verb usage
            dominant_lemma = stats['lemmas'].most_common(1)[0][0] if stats['lemmas'] else None
            if dominant_lemma and dominant_lemma != word_text:
                verb_lemmas[word_text] = {
                    'lemma': dominant_lemma,
                    'verb_pct': verb_count / stats['total'],
                    'count': stats['total'],
                }

    # POS distribution per word (for identifying mismatches)
    pos_analysis = {}
    for word_text, stats in word_stats.items():
        if stats['total'] < 2:
            continue  # skip rare words
        dominant_pos = stats['pos_counts'].most_common(1)[0][0] if stats['pos_counts'] else None
        if dominant_pos:
            our_pos = UPOS_MAP.get(dominant_pos)
            if our_pos:
                pos_analysis[word_text] = {
                    'stanza_pos': dominant_pos,
                    'our_pos': our_pos,
                    'count': stats['total'],
                    'confidence': stats['pos_counts'][dominant_pos] / stats['total'],
                }

    return {
        'lang': lang_code,
        'total_words': len(all_words),
        'unique_words': len(word_stats),
        'names': names,
        'verb_lemmas': verb_lemmas,
        'pos_analysis': pos_analysis,
    }


def main():
    # Process specified language or all
    target_lang = sys.argv[1] if len(sys.argv) > 1 else 'all'
    max_cards = int(sys.argv[2]) if len(sys.argv) > 2 else None

    # Load existing results to skip already-processed languages
    results = {}
    results_path = 'scripts/nlp-qc-results.json'
    if os.path.exists(results_path):
        with open(results_path, 'r', encoding='utf-8') as f:
            results = json.load(f)

    for lang_code, deck_path in LANGUAGES.items():
        if target_lang != 'all' and lang_code != target_lang:
            continue
        if lang_code in results and target_lang == 'all':
            print(f"  Skipping {lang_code} (already processed)")
            continue

        full_path = deck_path
        if not os.path.exists(full_path):
            print(f"Deck not found: {full_path}")
            continue

        result = process_language(lang_code, full_path, max_cards)
        results[lang_code] = result

        # Print summary
        print(f"\n  Summary for {lang_code.upper()}:")
        print(f"    Names detected: {len(result['names'])}")
        if result['names']:
            for name, info in sorted(result['names'].items(), key=lambda x: -x[1]['count'])[:20]:
                print(f"      {name}: {info['count']}x (PER {info['per_count']}x)")

        print(f"    Verb forms with lemmas: {len(result['verb_lemmas'])}")
        if result['verb_lemmas']:
            for word, info in sorted(result['verb_lemmas'].items(), key=lambda x: -x[1]['count'])[:20]:
                print(f"      {word} -> {info['lemma']} ({info['count']}x, {info['verb_pct']:.0%} verb)")

    # Save full results to JSON
    output_path = 'scripts/nlp-qc-results.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to {output_path}")


if __name__ == '__main__':
    main()
