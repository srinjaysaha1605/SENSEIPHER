import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorInfo,
  AttackCandidate,
  CandidateKey,
  CryptanalysisSummary,
  FrequencyRow,
  TopLetterItem,
} from '../types/api';

export const MIN_ALPHABETIC_CHARS = 20;
export const DEFAULT_TOP_N = 5;
export const MIN_TOP_N = 1;
export const MAX_TOP_N = 10;
export const DEFAULT_MAX_VIGENERE_KEY_LENGTH = 18;
export const MIN_VIGENERE_KEY_LENGTH = 2;
export const MAX_VIGENERE_KEY_LENGTH = 18;

export class ApiRequestError extends Error {
  readonly info: ApiErrorInfo;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = 'ApiRequestError';
    this.info = info;
  }
}

export function countAlphabeticChars(input: string): number {
  const matches = input.match(/[A-Za-z]/g);
  return matches ? matches.length : 0;
}

export function validateAnalyzeParams(request: AnalyzeRequest): ApiErrorInfo | null {
  const letterCount = countAlphabeticChars(request.ciphertext);
  if (letterCount < MIN_ALPHABETIC_CHARS) {
    return {
      kind: 'validation',
      title: 'More letters needed',
      message: `Enter at least ${MIN_ALPHABETIC_CHARS} letters (A–Z). Currently ${letterCount} found after ignoring spaces, numbers, and symbols.`,
      retryable: false,
    };
  }

  if (
    !Number.isInteger(request.top_n) ||
    request.top_n < MIN_TOP_N ||
    request.top_n > MAX_TOP_N
  ) {
    return {
      kind: 'validation',
      title: 'Invalid number of matches',
      message: `Number of matches must be a whole number between ${MIN_TOP_N} and ${MAX_TOP_N}.`,
      retryable: false,
    };
  }

  if (
    !Number.isInteger(request.max_vigenere_key_length) ||
    request.max_vigenere_key_length < MIN_VIGENERE_KEY_LENGTH ||
    request.max_vigenere_key_length > MAX_VIGENERE_KEY_LENGTH
  ) {
    return {
      kind: 'validation',
      title: 'Invalid max key length',
      message: `Max key length must be a whole number between ${MIN_VIGENERE_KEY_LENGTH} and ${MAX_VIGENERE_KEY_LENGTH}.`,
      retryable: false,
    };
  }

  return null;
}

function containsInternalLeak(text: string): boolean {
  return /(traceback|stack|exception|file\s+"|\/[a-z0-9_.-]+\.(py|ts|js)|onrender\.com|https?:\/\/)/i.test(
    text,
  );
}

export function extractValidationDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const detail = record.detail;

  if (typeof detail === 'string' && detail.trim().length > 0) {
    const cleaned = detail.trim();
    return containsInternalLeak(cleaned) ? null : cleaned;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          const cleaned = item.trim();
          return containsInternalLeak(cleaned) ? '' : cleaned;
        }
        if (item && typeof item === 'object') {
          const entry = item as Record<string, unknown>;
          const msg = typeof entry.msg === 'string' ? entry.msg.trim() : '';
          if (!msg || containsInternalLeak(msg)) {
            return '';
          }
          const loc = Array.isArray(entry.loc)
            ? entry.loc.filter((part) => part !== 'body').join('.')
            : '';
          if (msg && loc) {
            return `${loc}: ${msg}`;
          }
          return msg;
        }
        return '';
      })
      .filter((text) => text.length > 0);

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return null;
}

export interface DisplayKeyPair {
  label: string;
  value: string;
}

export function formatCandidateKey(key: CandidateKey): string {
  if (key === null || key === undefined) {
    return 'None reported';
  }
  if (typeof key === 'string') {
    return key.trim().length > 0 ? key : 'Empty';
  }
  if (typeof key === 'number' || typeof key === 'boolean') {
    return String(key);
  }
  if (Array.isArray(key)) {
    if (key.length === 0) {
      return 'Empty';
    }
    return key.map((item) => String(item)).join(', ');
  }
  if (typeof key === 'object') {
    const entries = Object.entries(key as Record<string, unknown>);
    if (entries.length === 0) {
      return 'Empty';
    }
    return entries.map(([k, v]) => `${k} -> ${String(v)}`).join(' · ');
  }
  return String(key);
}

export function formatDisplayKey(key: CandidateKey, method?: string): DisplayKeyPair | null {
  if (key === null || key === undefined) {
    return null;
  }

  const normalizedMethod = (method ?? '').toLowerCase();

  if (typeof key === 'string') {
    const trimmed = key.trim();
    return trimmed.length > 0 ? {label: 'Key', value: trimmed} : null;
  }

  if (typeof key === 'number') {
    if (!Number.isFinite(key)) {
      return null;
    }
    return {
      label: normalizedMethod.includes('caesar') ? 'Shift' : 'Key',
      value: String(key),
    };
  }

  if (typeof key === 'object' && !Array.isArray(key)) {
    const record = key as Record<string, unknown>;

    if (typeof record.shift === 'number' && Number.isFinite(record.shift)) {
      return {label: 'Shift', value: String(record.shift)};
    }
    if (typeof record.shift === 'string' && record.shift.trim().length > 0) {
      return {label: 'Shift', value: record.shift.trim()};
    }

    if (typeof record.keyword === 'string' && record.keyword.trim().length > 0) {
      return {label: 'Key', value: record.keyword.trim()};
    }

    if (
      (typeof record.key === 'string' && record.key.trim().length > 0) ||
      (typeof record.key === 'number' && Number.isFinite(record.key))
    ) {
      return {label: 'Key', value: String(record.key).trim()};
    }
  }

  return null;
}

export function extractTechnicalKeyEntries(key: CandidateKey): DisplayKeyPair[] {
  if (key === null || key === undefined) {
    return [];
  }
  if (typeof key === 'string' || typeof key === 'number' || typeof key === 'boolean') {
    return [{label: 'key', value: String(key)}];
  }
  if (Array.isArray(key)) {
    return key.length > 0 ? [{label: 'key', value: key.map((item) => String(item)).join(', ')}] : [];
  }
  if (typeof key === 'object') {
    return Object.entries(key as Record<string, unknown>).map(([k, v]) => ({
      label: k,
      value: Array.isArray(v) ? v.map((item) => String(item)).join(', ') : String(v ?? ''),
    }));
  }
  return [];
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeTopLetters(raw: unknown): TopLetterItem[] {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item): TopLetterItem | null => {
        if (typeof item === 'string') {
          return {label: item};
        }
        if (Array.isArray(item) && item.length >= 1) {
          const label = String(item[0]);
          const count = item.length >= 2 ? String(item[1]) : undefined;
          return {label, detail: count};
        }
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const label = asString(obj.character ?? obj.char ?? obj.letter ?? obj.symbol);
          if (!label) {
            return null;
          }
          if (obj.percentage !== undefined && obj.count !== undefined) {
            return {
              label,
              detail: `${asFiniteNumber(obj.count)} (${asFiniteNumber(obj.percentage).toFixed(1)}%)`,
            };
          }
          if (obj.count !== undefined) {
            return {label, detail: String(asFiniteNumber(obj.count))};
          }
          if (obj.percentage !== undefined) {
            return {label, detail: `${asFiniteNumber(obj.percentage).toFixed(1)}%`};
          }
          return {label};
        }
        return null;
      })
      .filter((entry): entry is TopLetterItem => entry !== null);
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([label, val]) => ({
      label,
      detail: typeof val === 'number' ? String(val) : String(val ?? ''),
    }));
  }
  return [];
}

function normalizeCandidate(raw: unknown): AttackCandidate | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    method: asString(obj.method, 'Unknown method'),
    key: obj.key as CandidateKey,
    plaintext: asString(obj.plaintext),
    language_score: asFiniteNumber(obj.language_score ?? obj.score),
  };
}

function normalizeFrequencyTable(raw: unknown): FrequencyRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => ({
      character: asString(row.character ?? row.char ?? row.letter, '?'),
      count: asFiniteNumber(row.count),
      percentage: asFiniteNumber(row.percentage ?? row.percent ?? row.freq),
    }));
}

function normalizeCryptanalysis(raw: unknown): CryptanalysisSummary {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    text_length: asFiniteNumber(obj.text_length ?? obj.length),
    index_of_coincidence: asFiniteNumber(obj.index_of_coincidence ?? obj.ioc ?? obj.ic),
    entropy: asFiniteNumber(obj.entropy ?? obj.shannon_entropy),
    vowel_ratio: asFiniteNumber(obj.vowel_ratio),
    repeated_bigram_ratio: asFiniteNumber(obj.repeated_bigram_ratio),
    unique_character_count: asFiniteNumber(
      obj.unique_character_count ?? obj.unique_characters ?? obj.unique_chars,
    ),
    top_letters: normalizeTopLetters(obj.top_letters),
  };
}

export function normalizeAnalyzeResponse(raw: unknown): AnalyzeResponse {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ApiRequestError({
      kind: 'server',
      title: 'Unexpected service response',
      message: 'The service returned a response that could not be read.',
      retryable: true,
    });
  }

  const obj = raw as Record<string, unknown>;
  const predictedFamily =
    typeof obj.predicted_family === 'string' ? obj.predicted_family.trim() : '';
  const hasCryptanalysis =
    Boolean(obj.cryptanalysis) &&
    typeof obj.cryptanalysis === 'object' &&
    !Array.isArray(obj.cryptanalysis);
  const hasAttack =
    Boolean(obj.attack) && typeof obj.attack === 'object' && !Array.isArray(obj.attack);

  if (!predictedFamily || !hasCryptanalysis || !hasAttack) {
    throw new ApiRequestError({
      kind: 'server',
      title: 'Unexpected service response',
      message: 'The service returned an incomplete analysis response. Please try again.',
      retryable: true,
    });
  }

  const rawScores =
    obj.decision_scores && typeof obj.decision_scores === 'object' && !Array.isArray(obj.decision_scores)
      ? (obj.decision_scores as Record<string, unknown>)
      : {};

  const decisionScores: Record<string, number> = {};
  for (const [label, value] of Object.entries(rawScores)) {
    decisionScores[label] = asFiniteNumber(value);
  }

  const rawAttack = obj.attack as Record<string, unknown>;
  const rawAlternatives = Array.isArray(rawAttack.alternatives) ? rawAttack.alternatives : [];

  return {
    predicted_family: predictedFamily,
    decision_scores: decisionScores,
    cryptanalysis: normalizeCryptanalysis(obj.cryptanalysis),
    frequency_table: normalizeFrequencyTable(obj.frequency_table),
    attack: {
      method: asString(rawAttack.method, 'Not specified'),
      candidate_count: asFiniteNumber(rawAttack.candidate_count ?? rawAttack.total_candidates),
      best_candidate: normalizeCandidate(rawAttack.best_candidate),
      alternatives: rawAlternatives
        .map(normalizeCandidate)
        .filter((item): item is AttackCandidate => item !== null),
    },
  };
}

export async function parseErrorResponse(response: Response): Promise<ApiErrorInfo> {
  const statusCode = response.status;
  const contentType = response.headers.get('content-type') ?? '';

  let payload: unknown = null;
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (statusCode === 422) {
    const detail = extractValidationDetail(payload);
    return {
      kind: 'validation',
      title: 'Check your input',
      message:
        detail ??
        'Please check your message and make sure it includes at least 20 letters.',
      retryable: false,
    };
  }

  return {
    kind: 'server',
    title: 'Service unavailable',
    message:
      'The analysis service could not complete this request right now. Your text is still here; please try again.',
    retryable: true,
  };
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiRequestError({
      kind: 'server',
      title: 'Service unavailable',
      message:
        'The analysis service is currently unreachable. Your text is preserved; please try again later.',
      retryable: true,
    });
  }

  try {
    return await response.json();
  } catch {
    throw new ApiRequestError({
      kind: 'server',
      title: 'Unreadable response',
      message: 'The service returned an unreadable response. Please try again.',
      retryable: true,
    });
  }
}

export async function analyzeCiphertext(
  request: AnalyzeRequest,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const validationError = validateAnalyzeParams(request);
  if (validationError) {
    throw new ApiRequestError(validationError);
  }

  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ciphertext: request.ciphertext,
        top_n: request.top_n,
        max_vigenere_key_length: request.max_vigenere_key_length,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiRequestError({
      kind: 'network',
      title: 'Connection failed',
      message:
        'Could not reach the analysis service. Check your connection or try again in a moment.',
      retryable: true,
    });
  }

  if (!response.ok) {
    throw new ApiRequestError(await parseErrorResponse(response));
  }

  const payload = await parseJsonOrThrow(response);
  return normalizeAnalyzeResponse(payload);
}
