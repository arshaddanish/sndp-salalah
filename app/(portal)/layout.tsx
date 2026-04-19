import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/ui/sidebar';

export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="bg-bg min-w-0 flex-1 px-8 py-8 md:ml-64">{children}</main>
    </div>
  );
}
