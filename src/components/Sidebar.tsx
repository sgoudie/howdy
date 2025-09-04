"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active ? "bg-gray-900 font-medium" : "hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-800 text-white">
      <div className="border-b px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold hover:underline">
          Howdy
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        <NavItem href="/dashboard" label="Dashboard" />
        <NavItem href="/keywords" label="Keywords" />
        <NavItem href="/settings" label="Settings" />
      </nav>
      <div className="mt-auto space-y-2 border-t px-4 py-4">
        <button
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
        <div className="text-xs text-gray-500">Howdy v0.1.0</div>
      </div>
    </div>
  );
}
