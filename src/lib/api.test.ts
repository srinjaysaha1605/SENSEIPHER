import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiRequestError,
  countAlphabeticChars,
  extractValidationDetail,
  formatCandidateKey,
  normalizeAnalyzeResponse,
  normalizeTopLetters,
  validateAnalyzeParams,
} from './api';

test('countAlphabeticChars counts only ASCII letters', () => {
  assert.equal(countAlphabeticChars('Attack at dawn! 1234'), 12);
  assert.equal(countAlphabeticChars('--- 999 ---'), 0);
  assert.equal(countAlphabeticChars('KHOOR ZRUOG WKLV LV D WHVW'), 21);
  assert.equal(countAlphabeticChars('ABCDEFGHIJKLMNOPQRST'), 20);
});

test('validateAnalyzeParams enforces minimum 20 alphabetic characters and parameter bounds', () => {
  const tooShort = validateAnalyzeParams({
    ciphertext: 'SHORT TEXT 1234567890',
    top_n: 5,
    max_vigenere_key_length: 18,
  });
  assert.equal(tooShort?.kind, 'validation');

  const badTopN = validateAnalyzeParams({
    ciphertext: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    top_n: 11,
    max_vigenere_key_length: 18,
  });
  assert.equal(badTopN?.kind, 'validation');

  const badKeyLen = validateAnalyzeParams({
    ciphertext: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    top_n: 5,
    max_vigenere_key_length: 1,
  });
  assert.equal(badKeyLen?.kind, 'validation');

  const valid = validateAnalyzeParams({
    ciphertext: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    top_n: 5,
    max_vigenere_key_length: 18,
  });
  assert.equal(valid, null);
});

test('extractValidationDetail handles string and FastAPI array detail payloads', () => {
  assert.equal(
    extractValidationDetail({detail: 'Ciphertext must contain at least 20 letters.'}),
    'Ciphertext must contain at least 20 letters.',
  );

  assert.equal(
    extractValidationDetail({
      detail: [{loc: ['body', 'top_n'], msg: 'Input should be less than or equal to 10'}],
    }),
    'top_n: Input should be less than or equal to 10',
  );

  assert.equal(extractValidationDetail(null), null);
  assert.equal(
    extractValidationDetail({detail: 'Traceback in /app/main.py on https://foo.onrender.com'}),
    null,
  );
});

test('formatCandidateKey handles varied key shapes without crashing', () => {
  assert.equal(formatCandidateKey(null), 'None reported');
  assert.equal(formatCandidateKey('LEMON'), 'LEMON');
  assert.equal(formatCandidateKey(3), '3');
  assert.equal(formatCandidateKey([2, 0, 3, 1]), '2, 0, 3, 1');
  assert.equal(formatCandidateKey({A: 'E', B: 'T'}), 'A -> E · B -> T');
});

test('normalizeTopLetters handles strings, tuples, objects, and records', () => {
  assert.deepEqual(normalizeTopLetters(['E', 'T']), [{label: 'E'}, {label: 'T'}]);
  assert.deepEqual(normalizeTopLetters([['E', 14]]), [{label: 'E', detail: '14'}]);
  assert.deepEqual(
    normalizeTopLetters([{character: 'E', count: 14, percentage: 12.5}]),
    [{label: 'E', detail: '14 (12.5%)'}],
  );
  assert.deepEqual(normalizeTopLetters({E: 14}), [{label: 'E', detail: '14'}]);
});

test('normalizeAnalyzeResponse handles absent best_candidate and empty alternatives safely', () => {
  const normalized = normalizeAnalyzeResponse({
    predicted_family: 'Transposition',
    decision_scores: {
      Transposition: 1.42,
      'Monoalphabetic Substitution': -0.35,
      'Polyalphabetic Substitution': -1.07,
    },
    cryptanalysis: {
      text_length: 84,
      index_of_coincidence: 0.064,
      entropy: 4.12,
      vowel_ratio: 0.38,
      repeated_bigram_ratio: 0.14,
      unique_character_count: 19,
      top_letters: ['E', 'T', 'A'],
    },
    frequency_table: [{character: 'E', count: 11, percentage: 13.1}],
    attack: {
      method: 'Columnar Transposition Search',
      candidate_count: 0,
      best_candidate: null,
      alternatives: [],
    },
  });

  assert.equal(normalized.predicted_family, 'Transposition');
  assert.equal(normalized.attack.best_candidate, null);
  assert.equal(normalized.attack.alternatives.length, 0);
  assert.equal(normalized.cryptanalysis.top_letters.length, 3);
});

test('normalizeAnalyzeResponse rejects incomplete payloads instead of fabricating results', () => {
  assert.throws(
    () => normalizeAnalyzeResponse({predicted_family: 'Transposition'}),
    (err: unknown) => err instanceof ApiRequestError && err.info.kind === 'server',
  );
  assert.throws(
    () => normalizeAnalyzeResponse({}),
    (err: unknown) => err instanceof ApiRequestError && err.info.kind === 'server',
  );
});
