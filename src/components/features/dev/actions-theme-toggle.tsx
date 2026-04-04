import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActionsThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export function ActionsThemeToggle({ isDark, onToggle }: Readonly<ActionsThemeToggleProps>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'h-8 rounded-md border px-2 text-xs font-medium',
        isDark
          ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
          : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
      )}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {isDark ? 'Light' : 'Dark'}
    </Button>
  );
}
