import {Check, ChevronDown, ChevronUp, Copy} from 'lucide-react';
import {useEffect, useState} from 'react';
import {formatCandidateKey} from '../lib/api';
import type {AnalyzeResponse, AttackCandidate} from '../types/api';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

function describeCipherFamily(family: string): string {
  const normalized = family.toLowerCase();
  if (normalized.includes('monoalphabetic')) {
    return 'Each letter swaps for one fixed replacement throughout the message.';
  }
  if (normalized.includes('polyalphabetic')) {
    return 'Letter shifts change across the message using a repeating key.';
  }
  if (normalized.includes('transposition')) {
    return 'The original letters stay the same and are rearranged in order.';
  }
  return 'Pattern group assigned by the analyzer.';
}

function CopyPlaintextButton({
  plaintext,
  ariaLabel,
}: {
  plaintext: string;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!plaintext) {
      return;
    }
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="min-h-[40px] px-3.5 py-2 border border-[#3f3f46] bg-[#050505] text-xs text-[#e4e4e7] hover:border-[#f4f4f5] hover:text-white transition-colors duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Copy text</span>
        </>
      )}
    </button>
  );
}

function AlternativeMatchRow({
  candidate,
  index,
}: {
  candidate: AttackCandidate;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const formattedKey = formatCandidateKey(candidate.key);
  const panelId = `alt-match-panel-${index}`;

  return (
    <div className="border-t border-[#27272a]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full py-3 px-1 text-left flex flex-wrap items-center justify-between gap-x-4 gap-y-2 hover:bg-[#111114] transition-colors duration-150 cursor-pointer"
      >
        <div className="min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-display font-bold text-[#f4f4f5] whitespace-nowrap">
            Match {index + 1}
          </span>
          <span className="text-[#d4d4d8]">{candidate.method}</span>
          <span className="text-[#a1a1aa] break-all">
            Key: <strong className="font-semibold text-[#e4e4e7]">{formattedKey}</strong>
          </span>
          <span className="text-[#a1a1aa] tabular-nums whitespace-nowrap">
            Score:{' '}
            <strong className="font-semibold text-[#e4e4e7]">
              {candidate.language_score.toFixed(4)}
            </strong>
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#d4d4d8] whitespace-nowrap shrink-0">
          <span>{expanded ? 'Hide text' : 'Show text'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      {expanded && (
        <div id={panelId} className="pb-4 pt-2 px-1">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <pre className="flex-1 min-w-0 border border-[#27272a] bg-[#050505] p-3 text-sm leading-relaxed text-[#f4f4f5] whitespace-pre-wrap break-all sm:break-words">
              {candidate.plaintext || 'No readable text returned.'}
            </pre>
            <CopyPlaintextButton
              plaintext={candidate.plaintext}
              ariaLabel={`Copy match ${index + 1} text`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalysisResults({result}: AnalysisResultsProps) {
  const [technicalOpen, setTechnicalOpen] = useState(false);

  const scoreEntries = Object.entries(result.decision_scores).sort(([, a], [, b]) => b - a);
  const maxFreqPercentage = result.frequency_table.reduce(
    (max, row) => Math.max(max, row.percentage),
    0,
  );

  const bestCandidate = result.attack.best_candidate;

  return (
    <div className="flex flex-col gap-6 fluid-reveal">
      {/* 1. Compact Predicted Cipher Summary + Collapsed Technical Details */}
      <section aria-labelledby="predicted-family-heading" className="border-b border-[#27272a] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <p className="text-xs text-[#a1a1aa]">Likely cipher type</p>
            <h2
              id="predicted-family-heading"
              className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#f4f4f5]"
            >
              {result.predicted_family}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setTechnicalOpen((prev) => !prev)}
            aria-expanded={technicalOpen}
            aria-controls="technical-details-panel"
            className="self-start sm:self-center min-h-[38px] px-3 py-1.5 border border-[#3f3f46] bg-[#0d0d10] text-xs text-[#e4e4e7] hover:border-[#f4f4f5] hover:text-white transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Technical details</span>
            {technicalOpen ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa] max-w-[62ch]">
          {describeCipherFamily(result.predicted_family)}
        </p>

        {technicalOpen && (
          <div id="technical-details-panel" className="mt-4 pt-4 border-t border-[#27272a]">
            <p className="text-xs leading-relaxed text-[#a1a1aa] max-w-[60ch]">
              These numbers are relative ranking scores used to compare cipher types. They are not
              probabilities or confidence percentages.
            </p>

            {scoreEntries.length > 0 ? (
              <dl className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#1e1e22] pt-3">
                {scoreEntries.map(([family, score]) => {
                  const isTop = family === result.predicted_family;
                  return (
                    <div key={family} className="flex items-baseline justify-between gap-2 text-xs">
                      <dt className={isTop ? 'font-semibold text-[#f4f4f5]' : 'text-[#a1a1aa]'}>
                        {family}
                      </dt>
                      <dd className="font-semibold text-[#f4f4f5] tabular-nums shrink-0">
                        {score.toFixed(4)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <p className="mt-3 text-xs text-[#a1a1aa]">No ranking scores returned.</p>
            )}
          </div>
        )}
      </section>

      {/* 2. Prominent Best Match + Compact Expandable Other Matches */}
      <section aria-labelledby="attack-results-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 id="attack-results-heading" className="font-display text-base font-bold text-[#f4f4f5]">
            Decoded matches
          </h2>
          <div className="text-xs text-[#a1a1aa] tabular-nums">
            <span>{result.attack.method}</span>
            <span aria-hidden="true"> · </span>
            <span>
              {result.attack.candidate_count}{' '}
              {result.attack.candidate_count === 1 ? 'match checked' : 'matches checked'}
            </span>
          </div>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-[#a1a1aa] max-w-[65ch]">
          These are ranked guesses; short or unusual messages may be harder to identify.
        </p>

        {bestCandidate ? (
          <div className="bg-[#3f3f46] p-[1px] chamfer-panel">
            <div className="bg-[#0d0d10] chamfer-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[#a1a1aa]">
                  <span className="font-display text-sm font-bold text-[#f4f4f5]">Best match</span>
                  <span aria-hidden="true">·</span>
                  <span>{bestCandidate.method}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#a1a1aa]">
                  <span className="break-all">
                    Key:{' '}
                    <strong className="font-semibold text-[#f4f4f5]">
                      {formatCandidateKey(bestCandidate.key)}
                    </strong>
                  </span>
                  <span className="tabular-nums whitespace-nowrap">
                    Score:{' '}
                    <strong className="font-semibold text-[#f4f4f5]">
                      {bestCandidate.language_score.toFixed(4)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-3">
                <pre
                  aria-label="Best match readable text"
                  className="flex-1 min-w-0 border border-[#27272a] bg-[#050505] p-3.5 text-sm leading-relaxed text-[#f4f4f5] whitespace-pre-wrap break-all sm:break-words"
                >
                  {bestCandidate.plaintext || 'No readable text returned.'}
                </pre>
                <CopyPlaintextButton
                  plaintext={bestCandidate.plaintext}
                  ariaLabel="Copy best match text"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="border border-[#27272a] bg-[#0d0d10] p-4 sm:p-5 max-w-[62ch]"
          >
            <h3 className="font-display text-sm font-bold text-[#f4f4f5]">
              No readable match found
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#a1a1aa]">
              No candidate produced a clear plain-text match for this message. Review the cipher
              type and letter counts below, or adjust Advanced options and try again.
            </p>
          </div>
        )}

        {result.attack.alternatives.length > 0 && (
          <div className="mt-4">
            <h3 className="font-display text-xs font-bold tracking-wide text-[#a1a1aa] mb-2">
              Other matches ({result.attack.alternatives.length})
            </h3>
            <div className="border-b border-[#27272a]">
              {result.attack.alternatives.map((candidate, index) => (
                <AlternativeMatchRow
                  key={`${candidate.method}-${index}`}
                  candidate={candidate}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Compact Letter Patterns Summary Strip */}
      <section aria-labelledby="patterns-strip-heading" className="border-t border-b border-[#27272a] py-4">
        <h2 id="patterns-strip-heading" className="sr-only">
          Key measurements and most common letters
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-3">
          <div>
            <dt className="text-xs text-[#a1a1aa]">Total letters</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.text_length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Distinct letters</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.unique_character_count}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Repeat index</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.index_of_coincidence.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Letter spread</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.entropy.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Vowel share</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.vowel_ratio.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Repeated pairs</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.repeated_bigram_ratio.toFixed(4)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 pt-3 border-t border-[#1e1e22] flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
          <span className="text-[#a1a1aa]">Most common letters:</span>
          {result.cryptanalysis.top_letters.length > 0 ? (
            <span className="font-semibold text-[#f4f4f5] tabular-nums">
              {result.cryptanalysis.top_letters
                .map((item) => (item.detail ? `${item.label} (${item.detail})` : item.label))
                .join(' · ')}
            </span>
          ) : (
            <span className="text-[#a1a1aa]">None reported</span>
          )}
        </div>
      </section>

      {/* 4. Full-Width Letter Counts Table */}
      <section aria-labelledby="frequency-table-heading" className="w-full">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 id="frequency-table-heading" className="font-display text-base font-bold text-[#f4f4f5]">
            Letter counts
          </h2>
          <span className="text-xs text-[#a1a1aa]">
            Observed count and share for each letter
          </span>
        </div>

        {result.frequency_table.length > 0 ? (
          <div className="w-full overflow-x-auto border-t border-[#27272a]">
            <table className="w-full border-collapse text-left text-xs">
              <caption className="sr-only">
                Letter counts showing letter, count, and share
              </caption>
              <thead className="text-[#a1a1aa] border-b border-[#27272a]">
                <tr>
                  <th scope="col" className="py-2.5 pr-4 font-semibold w-24">
                    Letter
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-right w-24">
                    Count
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-right w-28">
                    Share
                  </th>
                  <th scope="col" className="py-2.5 pl-4 font-semibold hidden sm:table-cell">
                    Spread
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e22]">
                {result.frequency_table.map((row) => {
                  const barWidth =
                    maxFreqPercentage > 0
                      ? Math.max(2, Math.round((row.percentage / maxFreqPercentage) * 100))
                      : 0;
                  return (
                    <tr key={row.character} className="hover:bg-[#111114] transition-colors">
                      <th scope="row" className="py-2 pr-4 font-semibold text-[#f4f4f5]">
                        {row.character}
                      </th>
                      <td className="px-4 py-2 text-right text-[#e4e4e7] tabular-nums">
                        {row.count}
                      </td>
                      <td className="px-4 py-2 text-right text-[#e4e4e7] tabular-nums">
                        {row.percentage.toFixed(2)}%
                      </td>
                      <td className="py-2 pl-4 hidden sm:table-cell">
                        <div className="w-full h-1.5 bg-[#141417]">
                          <div
                            aria-hidden="true"
                            className="h-full bg-[#e4e4e7] transition-[width] duration-300 ease-out"
                            style={{width: `${barWidth}%`}}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[#a1a1aa]">No letter counts returned.</p>
        )}
      </section>
    </div>
  );
}
