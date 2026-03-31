'use client';

import { Calendar as CalendarIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  startLabel?: string;
  endLabel?: string;
  inactiveLabel?: string;
  activeLabel?: string;
  clearLabel?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  className,
  startLabel = 'Joined After',
  endLabel = 'Expires Before',
  inactiveLabel = 'Filter by Date',
  activeLabel = 'Date Filter Active',
  clearLabel = 'Clear Date Filters',
}: Readonly<DateRangeFilterProps>) {
  const hasValue = startDate || endDate;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors outline-none',
            'bg-surface text-text-primary hover:bg-surface-hover border-border shrink-0',
            'focus:ring-accent/20 cursor-pointer focus:ring-2 focus:ring-offset-1',
            hasValue && 'border-accent/40 bg-accent-subtle',
            className,
          )}
        >
          <span className="flex items-center gap-1.5 overflow-hidden">
            <CalendarIcon className="text-text-muted h-4 w-4 shrink-0" />
            <span className="truncate">{hasValue ? activeLabel : inactiveLabel}</span>
          </span>
          {hasValue && (
            <button
              type="button"
              aria-label={clearLabel}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
            >
              <X className="text-accent h-3 w-3" />
            </button>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 space-y-4 p-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-xs font-medium tracking-wider uppercase">
              {startLabel}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="border-border focus:ring-accent/20 focus:border-accent w-full rounded border bg-white px-2 py-1.5 text-sm transition-all outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-xs font-medium tracking-wider uppercase">
              {endLabel}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndChange(e.target.value)}
              className="border-border focus:ring-accent/20 focus:border-accent w-full rounded border bg-white px-2 py-1.5 text-sm transition-all outline-none focus:ring-2"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-text-muted hover:text-danger h-8 w-full text-xs"
          >
            {clearLabel}
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
