import { ClipboardCopy, Play, RefreshCcw, WandSparkles } from 'lucide-react';
import { type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { FormFieldError, getFieldAriaProps } from '@/components/ui/form-field-error';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ActionRequestEditorProps = {
  input: string;
  error: string | null;
  isPending: boolean;
  isDark: boolean;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  // eslint-disable-next-line no-unused-vars
  onChange: (nextValue: string) => void;
  onRun: () => void;
  onFormat: () => void;
  onReset: () => void;
  onCopy: () => void;
};

export function ActionRequestEditor({
  input,
  error,
  isPending,
  isDark,
  editorRef,
  onChange,
  onRun,
  onFormat,
  onReset,
  onCopy,
}: Readonly<ActionRequestEditorProps>) {
  const fieldErrors = error ? { json: error } : {};
  const errorId = 'action-request-json-error';

  return (
    <section
      className={cn(
        'rounded-xl border p-3',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
      )}
    >
      <h3 className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
        Request Payload
      </h3>

      <label
        className={cn(
          'mt-2 block text-xs font-medium',
          isDark ? 'text-slate-400' : 'text-slate-600',
        )}
        htmlFor="action-request-json"
      >
        JSON Input
      </label>
      <Textarea
        ref={editorRef}
        id="action-request-json"
        value={input}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        disabled={isPending}
        className={cn(
          'mt-2 min-h-[290px] font-mono text-xs',
          isDark
            ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20'
            : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20',
        )}
        {...getFieldAriaProps(fieldErrors, 'json', errorId)}
      />
      <div className="mt-2">
        <FormFieldError fieldErrors={fieldErrors} fieldKey="json" errorId={errorId} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onFormat}
          disabled={isPending}
          className={cn(
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <WandSparkles className="size-4" />
          Format
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onReset}
          disabled={isPending}
          className={cn(
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <RefreshCcw className="size-4" />
          Reset
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCopy}
          disabled={isPending}
          className={cn(
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <ClipboardCopy className="size-4" />
          Copy Input
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onRun}
          disabled={isPending}
          className={cn(
            isDark
              ? 'bg-blue-500 text-white hover:bg-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-500',
          )}
        >
          <Play className="size-4" />
          {isPending ? 'Running...' : 'Run Action'}
        </Button>
      </div>
    </section>
  );
}
