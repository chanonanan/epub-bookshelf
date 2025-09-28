import { Navbar } from './Navbar';

export function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 py-2 px-4 ${className || ''}`}>{children}</main>
    </div>
  );
}
