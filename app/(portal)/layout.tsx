import { Sidebar } from '@/components/ui/sidebar';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="bg-bg min-w-0 flex-1 px-8 py-8 md:ml-64">{children}</main>
    </div>
  );
}
