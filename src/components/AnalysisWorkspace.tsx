import {ChevronDown, ChevronUp, HelpCircle, Loader2, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {
  analyzeCiphertext,
  ApiRequestError,
  countAlphabeticChars,
  DEFAULT_MAX_VIGENERE_KEY_LENGTH,
  DEFAULT_TOP_N,
} from '../lib/api';
import type {AnalyzeResponse, ApiErrorInfo} from '../types/api';
import {AnalysisResults} from './AnalysisResults';
import {CipherInput} from './CipherInput';
import {ErrorNotice} from './ErrorNotice';
import {BrandLogo} from './LandingGate';

interface AnalysisWorkspaceProps {
  onReturnToGate: () => void;
}

export function AnalysisWorkspace({onReturnToGate}: AnalysisWorkspaceProps) {
  const [ciphertext, setCiphertext] = useState('');
  const [topN, setTopN] = useState(DEFAULT_TOP_N);
  const [maxVigenereKeyLength, setMaxVigenereKeyLength] = useState(
    DEFAULT_MAX_VIGENERE_KEY_LENGTH,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [mobileInputOpen, setMobileInputOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const analyzeAbortRef = useRef<AbortController | null>(null);
  const workspaceHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    workspaceHeadingRef.current?.focus();
    return () => {
      analyzeAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!helpOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelpOpen(false);
        helpButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [helpOpen]);

  const runAnalysis = async () => {
    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeCiphertext(
        {
          ciphertext,
          top_n: topN,
          max_vigenere_key_length: maxVigenereKeyLength,
        },
        controller.signal,
      );
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setResult(null);
      if (err instanceof ApiRequestError) {
        setError(err.info);
      } else {
        setError({
          kind: 'server',
          title: 'Service unavailable',
          message: 'Something interrupted the request. Your text is still here; please try again.',
          retryable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCiphertext('');
    setError(null);
    setResult(null);
  };

  const letterCount = countAlphabeticChars(ciphertext);

  return (
    <div className="min-h-screen abstract-canvas text-[#f4f4f5] flex flex-col">
      <header className="w-full border-b border-[#27272a] bg-[#050505]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo />

          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={helpButtonRef}
              type="button"
              onClick={() => setHelpOpen((prev) => !prev)}
              aria-expanded={helpOpen}
              aria-controls="workspace-help-panel"
              className={`min-h-[40px] px-3 py-1.5 border text-xs transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                helpOpen
                  ? 'border-[#f4f4f5] bg-[#141418] text-white'
                  : 'border-[#3f3f46] bg-transparent text-[#d4d4d8] hover:border-[#f4f4f5] hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Help</span>
            </button>

            <button
              type="button"
              onClick={onReturnToGate}
              className="min-h-[40px] px-3.5 py-1.5 border border-[#3f3f46] bg-transparent text-xs text-[#d4d4d8] hover:border-[#f4f4f5] hover:text-white transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {helpOpen && (
        <section
          id="workspace-help-panel"
          aria-labelledby="workspace-help-heading"
          className="w-full border-b border-[#27272a] bg-[#0a0a0d] fluid-reveal"
        >
          <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#1e1e22]">
              <h2
                id="workspace-help-heading"
                className="font-display text-sm font-bold tracking-wide text-[#f4f4f5]"
              >
                How to read Senseipher
              </h2>
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  helpButtonRef.current?.focus();
                }}
                aria-label="Close help"
                className="min-h-[36px] px-2.5 py-1 border border-[#3f3f46] bg-transparent text-xs text-[#d4d4d8] hover:border-[#f4f4f5] hover:text-white transition-colors duration-150 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>

            <dl className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
              <div>
                <dt className="font-display font-bold text-[#f4f4f5]">Ciphertext input</dt>
                <dd className="mt-1 leading-relaxed text-[#a1a1aa] max-w-[58ch]">
                  Paste at least 20 alphabetic letters (spaces, numbers, and punctuation are
                  ignored). Open Advanced options to change the match count or max key length.
                </dd>
              </div>
              <div>
                <dt className="font-display font-bold text-[#f4f4f5]">Best match</dt>
                <dd className="mt-1 leading-relaxed text-[#a1a1aa] max-w-[58ch]">
                  Shows the highest-scoring plain-text candidate returned by the solver along with
                  its method, key, score, and copy button.
                </dd>
              </div>
              <div>
                <dt className="font-display font-bold text-[#f4f4f5]">Other matches</dt>
                <dd className="mt-1 leading-relaxed text-[#a1a1aa] max-w-[58ch]">
                  Lists lower-ranked alternatives by method, key, and score. Select Show text on
                  any row to inspect or copy that candidate.
                </dd>
              </div>
              <div>
                <dt className="font-display font-bold text-[#f4f4f5]">Letter counts</dt>
                <dd className="mt-1 leading-relaxed text-[#a1a1aa] max-w-[58ch]">
                  Summarizes letter repetition and spread above a full table of how often each
                  letter appears in your text.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
        <div className="mb-5 border-b border-[#27272a] pb-4">
          <h1
            ref={workspaceHeadingRef}
            tabIndex={-1}
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f5] focus:outline-none"
          >
            Decode a message
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#a1a1aa] max-w-[60ch]">
            Paste scrambled text to identify how it was mixed, spot letter patterns, and view
            likely plain-text matches.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,410px)_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
          <div className="min-w-0 flex flex-col gap-4 lg:sticky lg:top-6">
            <button
              type="button"
              onClick={() => setMobileInputOpen((prev) => !prev)}
              aria-expanded={mobileInputOpen}
              aria-controls="cipher-input-panel"
              className="lg:hidden w-full min-h-[44px] px-4 py-2.5 border border-[#3f3f46] bg-[#0d0d10] flex items-center justify-between gap-3 text-xs text-[#f4f4f5] hover:border-[#f4f4f5] transition-colors duration-150 cursor-pointer"
            >
              <span className="font-display font-bold tracking-wide">
                Message input ({letterCount} letters)
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#a1a1aa] shrink-0">
                <span>{mobileInputOpen ? 'Hide' : 'Show'}</span>
                {mobileInputOpen ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </span>
            </button>

            <div id="cipher-input-panel" className={mobileInputOpen ? 'block' : 'hidden lg:block'}>
              <CipherInput
                ciphertext={ciphertext}
                onCiphertextChange={(value) => {
                  setCiphertext(value);
                  if (error?.kind === 'validation') {
                    setError(null);
                  }
                }}
                topN={topN}
                onTopNChange={setTopN}
                maxVigenereKeyLength={maxVigenereKeyLength}
                onMaxVigenereKeyLengthChange={setMaxVigenereKeyLength}
                isLoading={isLoading}
                onSubmit={runAnalysis}
                onClear={handleClear}
              />
            </div>

            {error && (
              <ErrorNotice
                error={error}
                onRetry={error.retryable ? runAnalysis : undefined}
                onDismiss={() => setError(null)}
              />
            )}
          </div>

          <section aria-label="Analysis output" className="min-w-0">
            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#27272a] p-[1px] chamfer-panel fluid-reveal"
              >
                <div className="bg-[#0d0d10] chamfer-panel p-5 sm:p-6 flex flex-col items-start gap-2.5">
                  <div className="flex items-center gap-2.5 font-display text-sm font-bold text-[#f4f4f5]">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                    <span>Analyzing text...</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#a1a1aa] max-w-[55ch]">
                    Checking cipher type, counting letter patterns, and searching for readable
                    matches.
                  </p>
                </div>
              </div>
            ) : result ? (
              <AnalysisResults result={result} />
            ) : (
              <div className="border-t border-b border-[#27272a] py-6 sm:py-8">
                <h2 className="font-display text-lg font-bold text-[#f4f4f5]">
                  Waiting for your text
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa] max-w-[58ch]">
                  Paste at least 20 letters on the left, then select{' '}
                  <strong className="text-[#f4f4f5]">Analyze text</strong>.
                </p>
                <dl className="mt-5 pt-5 border-t border-[#27272a] grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <dt className="font-display font-bold text-[#e4e4e7]">Cipher type</dt>
                    <dd className="mt-1 text-[#a1a1aa] leading-relaxed max-w-[46ch]">
                      Shows the closest cipher type and an optional technical breakdown.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-display font-bold text-[#e4e4e7]">Matches & counts</dt>
                    <dd className="mt-1 text-[#a1a1aa] leading-relaxed max-w-[46ch]">
                      Highlights the best plain-text match alongside compact alternatives and letter
                      counts.
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
