import type { ActionCategory } from '@/lib/dev/actions-registry';
import { cn } from '@/lib/utils';

export type ActionRunHistoryItem = {
  id: string;
  actionId: string;
  actionTitle: string;
  categoryTitle: string;
  success: boolean;
  timestampIso: string;
  durationMs: number;
  payload: string;
};

type ActionsHistoryProps = {
  items: ActionRunHistoryItem[];
  categories: ActionCategory[];
  isDark: boolean;
  // eslint-disable-next-line no-unused-vars
  onSelectHistory: (item: ActionRunHistoryItem) => void;
  onClear: () => void;
};

function formatTime(timestampIso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestampIso));
}

export function ActionsHistory({
  items,
  categories,
  isDark,
  onSelectHistory,
  onClear,
}: Readonly<ActionsHistoryProps>) {
  const totalActions = categories.reduce((total, category) => total + category.actions.length, 0);

  return (
    <section
      className={cn(
        'rounded-xl border p-3',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
            Session History
          </h3>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
            {items.length} runs captured across {totalActions} actions.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'text-xs font-medium',
            isDark ? 'text-slate-400 hover:text-red-300' : 'text-slate-600 hover:text-red-600',
          )}
        >
          Clear
        </button>
      </div>

      <div className="mt-2 max-h-[250px] space-y-1.5 overflow-auto pr-1">
        {items.length ? (
          items.map((item) => {
            let statusClassName = '';
            if (item.success) {
              statusClassName = isDark ? 'text-emerald-300' : 'text-emerald-700';
            } else {
              statusClassName = isDark ? 'text-red-300' : 'text-red-600';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectHistory(item)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left',
                  isDark
                    ? 'border-slate-800 bg-slate-900 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      isDark ? 'text-slate-100' : 'text-slate-900',
                    )}
                  >
                    {item.actionTitle}
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {item.categoryTitle} | {formatTime(item.timestampIso)}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className={cn('text-xs font-semibold', statusClassName)}>
                    {item.success ? 'Success' : 'Error'}
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {item.durationMs}ms
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
            No runs yet. Execute an action to build quick replay history.
          </p>
        )}
      </div>
    </section>
  );
}
