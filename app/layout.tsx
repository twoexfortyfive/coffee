import '../styles/globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Coffee Diary',
  description: 'Simple coffee diary MVP'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/coffees" className="text-2xl font-semibold">
                Coffee Diary
              </Link>
              <p className="text-sm text-neutral-500">
                Track brews, notes, and what you love.
              </p>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm text-neutral-600">
              <Link href="/coffees" className="hover:text-neutral-900">
                Coffees
              </Link>
              <Link href="/import" className="hover:text-neutral-900">
                Import CSV
              </Link>
              <Link href="/insights" className="hover:text-neutral-900">
                Insights
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
