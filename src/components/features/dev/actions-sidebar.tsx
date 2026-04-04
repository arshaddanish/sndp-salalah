import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ActionCategory } from '@/lib/dev/actions-registry';
import { cn } from '@/lib/utils';

type ActionsSidebarProps = {
  categories: ActionCategory[];
  activeCategoryId: string;
  activeActionId: string;
  recentActionIds: string[];
  favoriteActionIds: string[];
  isDark: boolean;
  // eslint-disable-next-line no-unused-vars
  onSelectCategory: (categoryId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onSelectAction: (categoryId: string, actionId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleFavorite: (actionId: string) => void;
};

export function ActionsSidebar({
  categories,
  activeCategoryId,
  activeActionId,
  recentActionIds,
  favoriteActionIds,
  isDark,
  onSelectCategory,
  onSelectAction,
  onToggleFavorite,
}: Readonly<ActionsSidebarProps>) {
  const panelClassName = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  const headerBorderClassName = isDark ? 'border-slate-800' : 'border-slate-200';
  const titleClassName = isDark ? 'text-slate-100' : 'text-slate-900';
  const devPillClassName = isDark
    ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
    : 'border-blue-300 bg-blue-50 text-blue-700';
  const inactiveCategoryClassName = isDark
    ? 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100';
  const activeCategoryClassName = isDark
    ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
    : 'border-blue-300 bg-blue-50 text-blue-700';
  const actionTextClassName = isDark
    ? 'text-slate-200 hover:text-blue-200'
    : 'text-slate-700 hover:text-blue-700';
  const recentPillClassName = isDark
    ? 'border-blue-500/30 bg-blue-500/10 text-blue-200'
    : 'border-blue-300 bg-blue-50 text-blue-700';
  const favoriteButtonClassName = isDark
    ? 'text-slate-300 hover:bg-slate-800'
    : 'text-slate-600 hover:bg-slate-200';
  const emptyTextClassName = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <aside className={cn('rounded-xl border p-3', panelClassName)}>
      <div
        className={cn('flex items-center justify-between border-b pb-2.5', headerBorderClassName)}
      >
        <h2 className={cn('text-sm font-semibold', titleClassName)}>Action Registry</h2>
        <span
          className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', devPillClassName)}
        >
          Dev
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {categories.map((category) => {
          const isActiveCategory = category.id === activeCategoryId;
          let actionContent = null;

          if (isActiveCategory) {
            if (category.actions.length) {
              actionContent = (
                <div className="space-y-1">
                  {category.actions.map((action) => {
                    const isActiveAction = activeActionId === action.id;
                    const isFavorite = favoriteActionIds.includes(action.id);
                    const isRecent = recentActionIds.includes(action.id);
                    let actionRowClassName = '';
                    if (isActiveAction) {
                      actionRowClassName = activeCategoryClassName;
                    } else {
                      actionRowClassName = isDark
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-slate-200 bg-slate-50';
                    }
                    let favoriteIconClassName = '';
                    if (isFavorite) {
                      favoriteIconClassName = isDark
                        ? 'fill-blue-300 text-blue-300'
                        : 'fill-blue-600 text-blue-600';
                    } else {
                      favoriteIconClassName = isDark ? 'text-slate-500' : 'text-slate-400';
                    }

                    return (
                      <div
                        key={action.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-2 py-1',
                          actionRowClassName,
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectAction(category.id, action.id)}
                          className={cn(
                            'min-w-0 flex-1 truncate text-left text-sm',
                            actionTextClassName,
                          )}
                          title={action.title}
                        >
                          {action.title}
                        </button>
                        <div className="flex items-center gap-1" suppressHydrationWarning>
                          {isRecent ? (
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                recentPillClassName,
                              )}
                              title="Recently used"
                            >
                              Recent
                            </span>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn('h-7 w-7', favoriteButtonClassName)}
                            onClick={() => onToggleFavorite(action.id)}
                            aria-label={
                              isFavorite ? `Unpin ${action.title}` : `Pin ${action.title}`
                            }
                            suppressHydrationWarning
                          >
                            <Star className={cn('size-3.5', favoriteIconClassName)} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            } else {
              actionContent = (
                <p className={cn('px-1 text-xs', emptyTextClassName)}>
                  No actions available yet for this category.
                </p>
              );
            }
          }

          return (
            <section key={category.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold tracking-wide uppercase transition',
                  isActiveCategory ? activeCategoryClassName : inactiveCategoryClassName,
                )}
              >
                <span>{category.title}</span>
                <span>{category.actions.length}</span>
              </button>

              {actionContent}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
