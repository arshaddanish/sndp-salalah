'use client';

import { BarChart2, Building2, Home, LogOut, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Shakhas', href: '/shakhas', icon: Building2 },
  { name: 'Transactions', href: '/transactions', icon: WalletCards },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    console.log('Logging out...');
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log('Logout successful, redirecting...');
            setIsLogoutDialogOpen(false);
            router.push('/login');
            router.refresh();
          },
          onError: (ctx) => {
            console.error('Logout error context:', ctx);
            alert('Logout failed: ' + ctx.error.message);
          },
        },
      });
    } catch (err) {
      console.error('Logout unexpected error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="bg-sidebar-bg text-sidebar-text-primary border-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-sidebar-text-primary text-lg font-bold tracking-wide">
          SNDP <span className="text-accent">Salalah</span>
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-subtle text-accent border-accent rounded-l-none border-l-2'
                  : 'text-sidebar-text-secondary hover:bg-sidebar-hover-bg hover:text-sidebar-text-primary',
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive
                    ? 'text-accent'
                    : 'text-sidebar-text-secondary group-hover:text-sidebar-text-primary',
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-border border-t p-4">
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogTrigger asChild>
            <button className="hover:bg-sidebar-hover-bg hover:text-sidebar-text-primary text-sidebar-text-secondary group flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none">
              <LogOut className="text-sidebar-text-secondary group-hover:text-sidebar-text-primary h-4 w-4 shrink-0" />
              Logout
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You will need to enter your credentials again to
                access the portal.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
