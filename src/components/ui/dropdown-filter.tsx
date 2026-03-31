'use client';

import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  align?: 'start' | 'end';
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className,
  align = 'start',
}: FilterDropdownProps) {
  const activeOption = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors outline-none',
            'bg-surface text-text-primary hover:bg-surface-hover border-border max-w-[200px] shrink-0',
            'focus:ring-accent cursor-pointer focus:ring-2 focus:ring-offset-1',
            className,
          )}
        >
          <span className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-text-muted shrink-0">{label}:</span>
            <span className="truncate">{activeOption?.label || value}</span>
          </span>
          <ChevronDown className="text-text-muted h-4 w-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-[300px] w-56 overflow-y-auto">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center justify-between',
                isActive && 'bg-surface-hover font-medium',
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
              {isActive && <Check className="text-accent h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
