import {AlertTriangle, ServerCrash, WifiOff} from 'lucide-react';
import type {ApiErrorInfo} from '../types/api';

interface ErrorNoticeProps {
  error: ApiErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorNotice({error, onRetry, onDismiss}: ErrorNoticeProps) {
  const categoryLabel =
    error.kind === 'validation'
      ? 'Input issue'
      : error.kind === 'network'
        ? 'Connection issue'
        : 'Service issue';

  const Icon =
    error.kind === 'validation'
      ? AlertTriangle
      : error.kind === 'network'
        ? WifiOff
        : ServerCrash;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-[#3f3f46] p-[1px] chamfer-panel fluid-reveal"
    >
      <div className="bg-[#0d0d10] chamfer-panel p-4 sm:p-5 text-[#f4f4f5]">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-[#f4f4f5] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#d4d4d8]">{categoryLabel}</p>
            <h2 className="mt-1 font-display text-sm font-bold text-[#f4f4f5]">{error.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#d4d4d8] max-w-[60ch]">
              {error.message}
            </p>

            {(error.retryable && onRetry) || onDismiss ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {error.retryable && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="min-h-[40px] px-4 py-2 bg-[#f4f4f5] text-[#050505] chamfer-button text-xs font-semibold hover:bg-white transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Try again
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="min-h-[40px] px-4 py-2 border border-[#3f3f46] bg-transparent text-[#d4d4d8] text-xs hover:border-[#a1a1aa] hover:text-[#f4f4f5] transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
