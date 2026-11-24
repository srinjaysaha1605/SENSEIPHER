export type CipherFamily =
  | 'Monoalphabetic Substitution'
  | 'Polyalphabetic Substitution'
  | 'Transposition'
  | (string & {});

export type CandidateKey =
  | string
  | number
  | Array<string | number>
  | Record<string, unknown>
  | null
  | undefined;

export interface AnalyzeRequest {
  ciphertext: string;
  top_n: number;
  max_vigenere_key_length: number;
}

export interface AttackCandidate {
  method: string;
  key: CandidateKey;
  plaintext: string;
  language_score: number;
}

export interface FrequencyRow {
  character: string;
  count: number;
  percentage: number;
}

export interface TopLetterItem {
  label: string;
  detail?: string;
}

export interface CryptanalysisSummary {
  text_length: number;
  index_of_coincidence: number;
  entropy: number;
  vowel_ratio: number;
  repeated_bigram_ratio: number;
  unique_character_count: number;
  top_letters: TopLetterItem[];
}

export interface AttackResult {
  method: string;
  candidate_count: number;
  best_candidate: AttackCandidate | null;
  alternatives: AttackCandidate[];
}

export interface AnalyzeResponse {
  predicted_family: CipherFamily;
  decision_scores: Record<string, number>;
  cryptanalysis: CryptanalysisSummary;
  frequency_table: FrequencyRow[];
  attack: AttackResult;
}

export type ApiErrorKind = 'validation' | 'network' | 'server';

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  title: string;
  message: string;
  retryable: boolean;
}
