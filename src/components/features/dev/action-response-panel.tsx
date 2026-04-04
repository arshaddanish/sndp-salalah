import { ClipboardCopy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActionResponsePanelProps = {
  output: string;
  status: 'idle' | 'success' | 'error';
  executedAt: string | null;
  durationMs: number | null;
  isDark: boolean;
  onCopy: () => void;
};

function formatExecutedAt(executedAt: string | null): string {
  if (!executedAt) {
    return 'Not executed yet';
  }

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(executedAt));
}

function getStatusLabel(status: 'idle' | 'success' | 'error'): string {
  if (status === 'success') {
    return 'Success';
  }

  if (status === 'error') {
    return 'Error';
  }

  return 'Idle';
}

function getStatusClassName(status: 'idle' | 'success' | 'error', isDark: boolean): string {
  if (status === 'success') {
    return isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'error') {
    return isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-700';
  }

  return isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700';
}

export function ActionResponsePanel({
  output,
  status,
  executedAt,
  durationMs,
  isDark,
  onCopy,
}: Readonly<ActionResponsePanelProps>) {
  const statusLabel = getStatusLabel(status);
  const statusClassName = getStatusClassName(status, isDark);

  return (
    <section
      className={cn(
        'rounded-xl border p-3',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
          Response Inspector
        </h3>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusClassName)}>
            {statusLabel}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCopy}
            className={cn(
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <ClipboardCopy className="size-4" />
            Copy Output
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'mt-2 flex flex-wrap items-center gap-3 text-xs',
          isDark ? 'text-slate-400' : 'text-slate-600',
        )}
      >
        <span>{formatExecutedAt(executedAt)}</span>
        <span>{durationMs === null ? 'Duration: n/a' : `Duration: ${durationMs}ms`}</span>
      </div>

      <pre
        className={cn(
          'mt-2 min-h-[290px] overflow-auto rounded-lg border p-3 font-mono text-xs whitespace-pre-wrap',
          isDark
            ? 'border-slate-700 bg-slate-950 text-slate-100'
            : 'border-slate-200 bg-slate-50 text-slate-900',
        )}
        aria-live="polite"
      >
        {output || 'No response yet.'}
      </pre>
    </section>
  );
}
