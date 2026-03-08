'use client';

import { Building2, Home, LogOut, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Shakhas', href: '/members/shakhas', icon: Building2 },
  { name: 'Finance', href: '/finance', icon: WalletCards },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface text-text-primary border-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-text-primary text-lg font-bold tracking-wide">
          SNDP <span className="text-accent">Salalah</span>
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-subtle text-accent border-accent rounded-l-none border-l-2'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary',
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-border border-t p-4">
        <button className="text-text-secondary hover:bg-surface-hover hover:text-text-primary group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors">
          <LogOut className="text-text-secondary group-hover:text-text-primary h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
