import {AlertCircle, Check, ChevronDown, ChevronUp} from 'lucide-react';
import {type FormEvent, useState} from 'react';
import {
  countAlphabeticChars,
  MAX_TOP_N,
  MAX_VIGENERE_KEY_LENGTH,
  MIN_ALPHABETIC_CHARS,
  MIN_TOP_N,
  MIN_VIGENERE_KEY_LENGTH,
} from '../lib/api';

interface CipherInputProps {
  ciphertext: string;
  onCiphertextChange: (value: string) => void;
  topN: number;
  onTopNChange: (value: number) => void;
  maxVigenereKeyLength: number;
  onMaxVigenereKeyLengthChange: (value: number) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onClear: () => void;
}

export function CipherInput({
  ciphertext,
  onCiphertextChange,
  topN,
  onTopNChange,
  maxVigenereKeyLength,
  onMaxVigenereKeyLengthChange,
  isLoading,
  onSubmit,
  onClear,
}: CipherInputProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const letterCount = countAlphabeticChars(ciphertext);
  const hasEnoughLetters = letterCount >= MIN_ALPHABETIC_CHARS;
  const remaining = Math.max(0, MIN_ALPHABETIC_CHARS - letterCount);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleTopNInput = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      onTopNChange(MIN_TOP_N);
      return;
    }
    onTopNChange(Math.min(MAX_TOP_N, Math.max(MIN_TOP_N, parsed)));
  };

  const handleKeyLengthInput = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      onMaxVigenereKeyLengthChange(MIN_VIGENERE_KEY_LENGTH);
      return;
    }
    onMaxVigenereKeyLengthChange(
      Math.min(MAX_VIGENERE_KEY_LENGTH, Math.max(MIN_VIGENERE_KEY_LENGTH, parsed)),
    );
  };

  return (
    <div className="bg-[#27272a] p-[1px] chamfer-panel">
      <form
        onSubmit={handleFormSubmit}
        className="bg-[#0d0d10] chamfer-panel p-4 sm:p-5 flex flex-col gap-4"
        noValidate
      >
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="ciphertext-input"
              className="font-display text-sm font-bold tracking-wide text-[#f4f4f5]"
            >
              Scrambled text
            </label>
            <span className="text-xs text-[#a1a1aa] tabular-nums">
              At least {MIN_ALPHABETIC_CHARS} letters
            </span>
          </div>

          <p
            id="ciphertext-help"
            className="mt-1.5 text-xs leading-relaxed text-[#a1a1aa] max-w-[54ch]"
          >
            Paste your coded message below. Spaces, numbers, and symbols do not count toward the
            20-letter minimum.
          </p>

          <textarea
            id="ciphertext-input"
            name="ciphertext"
            rows={7}
            value={ciphertext}
            onChange={(event) => onCiphertextChange(event.target.value)}
            aria-describedby="ciphertext-help ciphertext-count-status"
            placeholder="Paste scrambled letters here..."
            spellCheck={false}
            autoComplete="off"
            className="mt-2.5 w-full border border-[#27272a] bg-[#050505] px-3 py-2.5 text-sm leading-relaxed text-[#f4f4f5] placeholder:text-[#71717a] focus:border-[#f4f4f5] focus:outline-none resize-y min-h-[160px] transition-colors duration-150"
          />

          <div
            id="ciphertext-count-status"
            aria-live="polite"
            className="mt-2 flex items-center gap-2 text-xs text-[#d4d4d8]"
          >
            {hasEnoughLetters ? (
              <>
                <Check className="w-4 h-4 text-[#f4f4f5] shrink-0" aria-hidden="true" />
                <span className="tabular-nums">{letterCount} letters ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-[#a1a1aa] shrink-0" aria-hidden="true" />
                <span className="tabular-nums text-[#a1a1aa]">
                  {letterCount} / {MIN_ALPHABETIC_CHARS} letters · Add {remaining} more{' '}
                  {remaining === 1 ? 'letter' : 'letters'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#27272a]">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            aria-expanded={advancedOpen}
            aria-controls="advanced-options-panel"
            className="w-full min-h-[36px] flex items-center justify-between gap-2 text-xs font-semibold text-[#d4d4d8] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            <span>Advanced options</span>
            {advancedOpen ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {advancedOpen && (
            <div
              id="advanced-options-panel"
              className="mt-3 pt-3 border-t border-[#1e1e22] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="top-n-input" className="block text-xs font-semibold text-[#f4f4f5]">
                    Number of matches
                  </label>
                  <p className="mt-0.5 text-xs text-[#a1a1aa]">
                    Range: {MIN_TOP_N}–{MAX_TOP_N}
                  </p>
                </div>
                <input
                  id="top-n-input"
                  name="top_n"
                  type="number"
                  min={MIN_TOP_N}
                  max={MAX_TOP_N}
                  step={1}
                  value={topN}
                  onChange={(event) => handleTopNInput(event.target.value)}
                  className="w-24 min-h-[40px] border border-[#27272a] bg-[#050505] px-3 py-1.5 text-sm text-[#f4f4f5] text-right tabular-nums focus:border-[#f4f4f5] focus:outline-none transition-colors duration-150"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <label
                    htmlFor="key-length-input"
                    className="block text-xs font-semibold text-[#f4f4f5]"
                  >
                    Max key length
                  </label>
                  <p className="mt-0.5 text-xs text-[#a1a1aa]">
                    Range: {MIN_VIGENERE_KEY_LENGTH}–{MAX_VIGENERE_KEY_LENGTH}
                  </p>
                </div>
                <input
                  id="key-length-input"
                  name="max_vigenere_key_length"
                  type="number"
                  min={MIN_VIGENERE_KEY_LENGTH}
                  max={MAX_VIGENERE_KEY_LENGTH}
                  step={1}
                  value={maxVigenereKeyLength}
                  onChange={(event) => handleKeyLengthInput(event.target.value)}
                  className="w-24 min-h-[40px] border border-[#27272a] bg-[#050505] px-3 py-1.5 text-sm text-[#f4f4f5] text-right tabular-nums focus:border-[#f4f4f5] focus:outline-none transition-colors duration-150"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="flex-1 min-h-[44px] px-5 py-2 bg-[#f4f4f5] text-[#050505] chamfer-button font-display text-sm font-bold tracking-wide hover:bg-white disabled:opacity-60 disabled:cursor-wait transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            {isLoading ? 'Analyzing...' : 'Analyze text'}
          </button>

          {ciphertext.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading}
              className="min-h-[44px] px-4 py-2 border border-[#3f3f46] bg-transparent text-xs text-[#d4d4d8] hover:border-[#a1a1aa] hover:text-[#f4f4f5] disabled:opacity-50 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
