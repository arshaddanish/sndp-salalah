export default function DevLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-bg min-h-screen">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
    </div>
  );
}
