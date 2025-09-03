import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-semibold hover:underline">
            Howdy
          </Link>
          <div />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="w-full p-4 text-sm text-gray-500">Howdy v0.1.0</footer>
    </div>
  );
}


